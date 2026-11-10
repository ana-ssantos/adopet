import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageCircle, PawPrint } from "lucide-react";
import { PhoneFrame, RequireAuth, TealHeader } from "@/components/adopet/AppShell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/painel-abrigo")({
  head: () => ({ meta: [
    { title: "Painel do abrigo — ADOPET" },
    { name: "description", content: "Gerencie os pets e as conversas do seu abrigo no ADOPET." },
    { property: "og:title", content: "Painel do abrigo — ADOPET" },
    { property: "og:description", content: "Gerencie os pets e as conversas do seu abrigo no ADOPET." },
  ] }),
  component: Painel,
});

function Painel() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  return (
    <PhoneFrame>
      <RequireAuth role="abrigo">
        <main className="no-scrollbar animate-screen flex-1 overflow-y-auto">
          <TealHeader>
            <p className="text-sm opacity-80">Painel do abrigo</p>
            <h1 className="text-xl font-bold">{user?.name}</h1>
          </TealHeader>
          <div className="m-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card p-4 shadow-card"><PawPrint className="size-5 text-teal" /><p className="mt-2 text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Pets cadastrados</p></div>
            <div className="rounded-2xl bg-card p-4 shadow-card"><MessageCircle className="size-5 text-teal" /><p className="mt-2 text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Conversas</p></div>
          </div>
          <div className="m-4 space-y-1 rounded-2xl bg-card p-5 text-sm shadow-card">
            <p className="font-semibold">Dados da conta</p>
            <p>{user?.email}</p>
            <p>{user?.phone}</p>
            {user?.document && <p>CNPJ/CPF: {user.document}</p>}
          </div>
          <div className="px-4 pb-6">
            <Button size="lg" className="w-full" onClick={async () => { await logout(); navigate({ to: "/login", replace: true }); }}>Sair</Button>
          </div>
        </main>
      </RequireAuth>
    </PhoneFrame>
  );
}
