import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TabScreen, TealHeader } from "@/components/adopet/AppShell";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [
    { title: "Perfil — ADOPET" },
    { name: "description", content: "Seus dados de tutor no ADOPET." },
    { property: "og:title", content: "Perfil — ADOPET" },
    { property: "og:description", content: "Seus dados de tutor no ADOPET." },
  ] }),
  component: Perfil,
});

function Perfil() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  return (
    <TabScreen>
      <TealHeader><h1 className="text-xl font-bold">Perfil</h1></TealHeader>
      <div className="m-4 space-y-2 rounded-2xl bg-card p-5 text-sm shadow-card">
        <p className="text-lg font-bold">{user?.name}</p>
        <p>{user?.email}</p>
        <p>{user?.phone}</p>
        <p>{user?.city}</p>
      </div>
      <div className="px-4">
        <Button size="lg" className="w-full" onClick={() => { logout(); navigate({ to: "/login" }); }}>Sair</Button>
      </div>
    </TabScreen>
  );
}
