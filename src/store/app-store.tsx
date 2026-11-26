/**
 * Estado global (Context API) com persistência em localStorage:
 * usuário, contas cadastradas, favoritos, filtros e conversas.
 * Autenticação real via Lovable Cloud (e-mail + senha); tipo de conta em profiles.role.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Coat, Sex, Size, Species } from "@/data/pets";

export type Role = "tutor" | "abrigo";
export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  city?: string | null;
  age?: number | null;
  document?: string | null;
}
export interface SignUpInput {
  role: Role;
  name: string;
  email: string;
  password: string;
  phone: string;
  city?: string;
  age?: number;
  document?: string | undefined;
}

export interface Filters {
  species: Species[];
  sex: Sex[];
  size: Size[];
  coat: Coat[];
  vaccinated: boolean;
  dewormed: boolean;
  neutered: boolean;
  age: [number, number];
}

export const emptyFilters: Filters = { species: [], sex: [], size: [], coat: [], vaccinated: false, dewormed: false, neutered: false, age: [0, 15] };

export const countFilters = (f: Filters) =>
  f.species.length + f.sex.length + f.size.length + f.coat.length + Number(f.vaccinated) + Number(f.dewormed) + Number(f.neutered) + (f.age[0] !== 0 || f.age[1] !== 15 ? 1 : 0);

interface Store {
  ready: boolean;
  user: User | null;
  register: (u: SignUpInput) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<{ error?: string; role?: Role }>;
  logout: () => Promise<void>;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
}

const Ctx = createContext<Store | null>(null);

const K = { fav: "adopet:favorites", filters: "adopet:filters" };
const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

async function fetchProfile(uid: string): Promise<User | null> {
  const { data } = await supabase.from("profiles").select("id, role, name, email, phone, city, age, document").eq("id", uid).maybeSingle();
  return data ? { ...data, role: data.role === "abrigo" ? "abrigo" : "tutor" } : null;
}

const translateAuthError = (m: string) => {
  if (/invalid login/i.test(m)) return "E-mail ou senha inválidos";
  if (/not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar";
  if (/already registered/i.test(m)) return "Este e-mail já está cadastrado";
  if (/pwned|leaked|compromised|known|weak/i.test(m)) return "Essa senha é muito comum ou já apareceu em vazamentos. Escolha outra";
  if (/password/i.test(m)) return "Senha inválida. Use no mínimo 8 caracteres, com letras e números";
  return "Não foi possível concluir. Tente novamente.";
};

/** Rota inicial de cada tipo de conta. */
export const homeFor = (role: Role) => (role === "abrigo" ? "/painel-abrigo" : "/") as "/" | "/painel-abrigo";

/** Regras de senha compartilhadas por tutor e abrigo. */
export const validatePassword = (rawPassword: string, rawConfirm: string) => {
  const password = rawPassword.trim();
  const confirm = rawConfirm.trim();
  const e: { password?: string; confirm?: string } = {};
  if (password.length < 8) e.password = "A senha precisa ter no mínimo 8 caracteres";
  else if (!/[A-Za-z]/.test(password)) e.password = "A senha precisa ter pelo menos uma letra";
  else if (!/[0-9]/.test(password)) e.password = "A senha precisa ter pelo menos um número";
  if (!confirm) e.confirm = "Confirme sua senha";
  else if (password && confirm !== password) e.confirm = "As senhas não coincidem";
  return e;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [dataReady, setReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const ready = dataReady && authReady;
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(emptyFilters);

  // Carrega do localStorage apenas no cliente (evita divergência no SSR)
  useEffect(() => {
    setFavorites(read(K.fav, []));
    setFiltersState(read(K.filters, emptyFilters));
    // Conversas agora vêm do banco: apaga as de exemplo que versões antigas salvaram no navegador.
    try { localStorage.removeItem("adopet:conversations"); } catch { /* ignora */ }
    setReady(true);
  }, []);

  useEffect(() => { if (dataReady) write(K.fav, favorites); }, [favorites, dataReady]);
  useEffect(() => { if (dataReady) write(K.filters, filters); }, [filters, dataReady]);

  // Sessão: carrega perfil (com role) sempre que o usuário entra/sai
  useEffect(() => {
    const load = async (uid: string | undefined) => {
      setUser(uid ? await fetchProfile(uid) : null);
      setAuthReady(true);
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => load(session?.user.id), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const register = useCallback<Store["register"]>(async ({ email, password, ...meta }) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: { data: meta },
    });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  }, []);
  const login = useCallback<Store["login"]>(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: password.trim() });
    if (error || !data.user) return { error: translateAuthError(error?.message ?? "") };
    const profile = await fetchProfile(data.user.id);
    if (!profile) return { error: "Perfil não encontrado para esta conta" };
    setUser(profile);
    return { role: profile.role };
  }, []);
  const logout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); }, []);
  const toggleFavorite = useCallback((id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), []);

  const value = useMemo<Store>(() => ({ ready, user, register, login, logout, favorites, toggleFavorite, filters, setFilters: setFiltersState }),
    [ready, user, register, login, logout, favorites, toggleFavorite, filters]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp fora do AppProvider");
  return c;
};
