import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, User } from "lucide-react";
import { homeFor, useApp, type Role } from "@/store/app-store";
import { cn } from "@/lib/utils";

/** Moldura de celular (centralizada no desktop, tela cheia no mobile). */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-desk sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="relative mx-auto flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-background sm:h-[844px] sm:rounded-[2.5rem] sm:border-8 sm:border-foreground sm:shadow-phone">
        {children}
      </div>
    </div>
  );
}

/** Garante usuário logado com o role certo; senão redireciona. */
export function RequireAuth({ children, role = "tutor" }: { children: ReactNode; role?: Role }) {
  const { ready, user } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (user.role !== role) navigate({ to: homeFor(user.role), replace: true });
  }, [ready, user, role, navigate]);
  if (!ready || !user || user.role !== role) return <div className="flex-1" aria-busy="true" />;
  return <>{children}</>;
}

const tabs = [
  { to: "/", label: "Início", icon: Home },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/mensagens", label: "Mensagens", icon: MessageCircle },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { conversations } = useApp();
  const unread = Object.values(conversations).reduce((n, c) => n + c.unread, 0);
  return (
    <nav aria-label="Navegação principal" className="grid grid-cols-4 border-t bg-card px-2 pb-2 pt-1.5">
      {tabs.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-teal" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className={cn("rounded-full px-4 py-1 transition-colors", active && "bg-teal-soft")}>
              <Icon className="size-5" />
            </span>
            {label}
            {to === "/mensagens" && unread > 0 && (
              <span className="absolute right-5 top-1 grid size-4 place-items-center rounded-full bg-heart text-[10px] font-bold text-primary-foreground">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Layout das telas logadas: conteúdo rolável + barra inferior. */
export function TabScreen({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <PhoneFrame>
      <RequireAuth>
        <main className="no-scrollbar animate-screen flex-1 overflow-y-auto">{children}</main>
        {nav && <BottomNav />}
      </RequireAuth>
    </PhoneFrame>
  );
}

export function TealHeader({ children }: { children?: ReactNode }) {
  return <header className="bg-teal px-5 pb-5 pt-6 text-teal-foreground">{children}</header>;
}

const shelterTabs = [
  { to: "/painel-abrigo", label: "Painel", icon: Home },
  { to: "/mensagensdoador", label: "Mensagens", icon: MessageCircle },
] as const;

/** Barra inferior do abrigo. */
export function ShelterNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Navegação do abrigo" className="grid grid-cols-2 border-t bg-card px-2 pb-2 pt-1.5">
      {shelterTabs.map(({ to, label, icon: Icon }) => {
        const active = path.startsWith(to);
        return (
          <Link key={to} to={to} aria-current={active ? "page" : undefined}
            className={cn("flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-teal" : "text-muted-foreground hover:text-foreground")}>
            <span className={cn("rounded-full px-4 py-1 transition-colors", active && "bg-teal-soft")}><Icon className="size-5" /></span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
