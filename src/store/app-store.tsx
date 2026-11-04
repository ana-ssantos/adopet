/**
 * Estado global (Context API) com persistência em localStorage:
 * usuário, contas cadastradas, favoritos, filtros e conversas.
 * Autenticação é SIMULADA — não usar em produção.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Coat, Sex, Size, Species } from "@/data/pets";

export interface User {
  name: string;
  email: string;
  phone: string;
  city: string;
  age: number;
  password: string;
  photo?: string;
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
  register: (u: User) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  conversations: Record<string, Conversation>;
  setConversation: (id: string, c: Conversation | ((prev?: Conversation) => Conversation)) => void;
}

const Ctx = createContext<Store | null>(null);

const K = { accounts: "adopet:accounts", session: "adopet:session", fav: "adopet:favorites", filters: "adopet:filters", conv: "adopet:conversations" };
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(emptyFilters);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});

  // Carrega do localStorage apenas no cliente (evita divergência no SSR)
  useEffect(() => {
    const acc = read<User[]>(K.accounts, []);
    const email = read<string | null>(K.session, null);
    setAccounts(acc);
    setUser(acc.find((a) => a.email === email) ?? null);
    setFavorites(read(K.fav, []));
    setFiltersState(read(K.filters, emptyFilters));
    setConversations(read(K.conv, null) ?? seedConversations());
    setReady(true);
  }, []);

  useEffect(() => { if (ready) write(K.fav, favorites); }, [favorites, ready]);
  useEffect(() => { if (ready) write(K.filters, filters); }, [filters, ready]);
  useEffect(() => { if (ready) write(K.conv, conversations); }, [conversations, ready]);
  useEffect(() => { if (ready) write(K.accounts, accounts); }, [accounts, ready]);

  const register = useCallback((u: User) => {
    setAccounts((a) => [...a.filter((x) => x.email !== u.email), u]);
  }, []);
  const login = useCallback((email: string, password: string) => {
    const found = accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
    if (!found) return false;
    setUser(found);
    write(K.session, found.email);
    return true;
  }, [accounts]);
  const logout = useCallback(() => { setUser(null); localStorage.removeItem(K.session); }, []);
  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, ...patch };
      setAccounts((a) => a.map((x) => (x.email === u.email ? next : x)));
      write(K.session, next.email);
      return next;
    });
  }, []);
  const toggleFavorite = useCallback((id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), []);
  const setConversation = useCallback<Store["setConversation"]>((id, c) => {
    setConversations((all) => ({ ...all, [id]: typeof c === "function" ? c(all[id]) : c }));
  }, []);

  const value = useMemo<Store>(() => ({ ready, user, register, login, logout, updateUser, favorites, toggleFavorite, filters, setFilters: setFiltersState, conversations, setConversation }),
    [ready, user, register, login, logout, updateUser, favorites, toggleFavorite, filters, conversations, setConversation]);
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
