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

export interface Message {
  id: string;
  from: "me" | "shelter";
  text?: string;
  image?: string;
  at: number;
}
export interface Conversation {
  shelterId: string;
  petId?: string;
  messages: Message[];
  unread: number;
}

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
  conversations: Record<string, Conversation>;
  setConversation: (id: string, c: Conversation | ((prev?: Conversation) => Conversation)) => void;
}

const Ctx = createContext<Store | null>(null);

const K = { fav: "adopet:favorites", filters: "adopet:filters", conv: "adopet:conversations" };
const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

const minsAgo = (m: number) => Date.now() - m * 60_000;
/** Conversas iniciais para a tela de Mensagens não começar vazia. */
const seedConversations = (): Record<string, Conversation> => ({
  apc: { shelterId: "apc", petId: "thor", unread: 0, messages: [
    { id: "s1", from: "shelter", text: "Seja bem-vindo ao Abrigo Patinhas Cariocas! Vi que deseja falar sobre o nosso aumigo Thor, certo?", at: minsAgo(25) },
    { id: "s2", from: "me", text: "Me conte sobre o Thor!", at: minsAgo(19) },
  ] },
  maa: { shelterId: "maa", petId: "max", unread: 1, messages: [
    { id: "s3", from: "shelter", text: "Seja bem-vindo ao Meus Amigos Animais! Vi que deseja falar sobre o nosso aumigo Max, certo?", at: minsAgo(6) },
  ] },
});

async function fetchProfile(uid: string): Promise<User | null> {
  const { data } = await supabase.from("profiles").select("id, role, name, email, phone, city, age, document").eq("id", uid).maybeSingle();
  return data ? { ...data, role: data.role === "abrigo" ? "abrigo" : "tutor" } : null;
}

const translateAuthError = (m: string) => {
  if (/invalid login/i.test(m)) return "E-mail ou senha inválidos";
  if (/not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar";
  if (/already registered/i.test(m)) return "Este e-mail já está cadastrado";
  if (/password/i.test(m)) return "Senha fraca ou inválida. Use ao menos 8 caracteres";
  return "Não foi possível concluir. Tente novamente.";
};

/** Rota inicial de cada tipo de conta. */
export const homeFor = (role: Role) => (role === "abrigo" ? "/painel-abrigo" : "/") as "/" | "/painel-abrigo";

/** Regras de senha compartilhadas por tutor e abrigo. */
export const validatePassword = (password: string, confirm: string) => {
  const e: { password?: string; confirm?: string } = {};
  if (password.length < 8) e.password = "A senha precisa ter ao menos 8 caracteres";
  if (confirm !== password) e.confirm = "As senhas não coincidem";
  return e;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [dataReady, setReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const ready = dataReady && authReady;
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(emptyFilters);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});

  // Carrega do localStorage apenas no cliente (evita divergência no SSR)
  useEffect(() => {
    setFavorites(read(K.fav, []));
    setFiltersState(read(K.filters, emptyFilters));
    setConversations(read(K.conv, null) ?? seedConversations());
    setReady(true);
  }, []);

  useEffect(() => { if (dataReady) write(K.fav, favorites); }, [favorites, dataReady]);
  useEffect(() => { if (dataReady) write(K.filters, filters); }, [filters, dataReady]);
  useEffect(() => { if (dataReady) write(K.conv, conversations); }, [conversations, dataReady]);

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
      password,
      options: { data: meta },
    });
    if (error) return { error: translateAuthError(error.message) };
    return {};
  }, []);
  const login = useCallback<Store["login"]>(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) return { error: translateAuthError(error?.message ?? "") };
    const profile = await fetchProfile(data.user.id);
    if (!profile) return { error: "Perfil não encontrado para esta conta" };
    setUser(profile);
    return { role: profile.role };
  }, []);
  const logout = useCallback(async () => { await supabase.auth.signOut(); setUser(null); }, []);
  const toggleFavorite = useCallback((id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), []);
  const setConversation = useCallback<Store["setConversation"]>((id, c) => {
    setConversations((all) => ({ ...all, [id]: typeof c === "function" ? c(all[id]) : c }));
  }, []);

  const value = useMemo<Store>(() => ({ ready, user, register, login, logout, favorites, toggleFavorite, filters, setFilters: setFiltersState, conversations, setConversation }),
    [ready, user, register, login, logout, favorites, toggleFavorite, filters, conversations, setConversation]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp fora do AppProvider");
  return c;
};

export const relativeTime = (at: number) => {
  const m = Math.floor((Date.now() - at) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${String(m).padStart(2, "0")} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
};
