import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { TabScreen, TealHeader } from "@/components/adopet/AppShell";
import { getPet, getShelter } from "@/data/pets";
import { fetchDbPets } from "@/lib/db-pets";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/solicitacoes")({
  head: () => ({ meta: [
    { title: "Minhas solicitações — ADOPET" },
    { name: "description", content: "Acompanhe o status das suas solicitações de adoção." },
    { property: "og:title", content: "Minhas solicitações — ADOPET" },
    { property: "og:description", content: "Acompanhe o status das suas solicitações de adoção." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Solicitacoes,
});

const statusStyle: Record<string, string> = {
  pendente: "bg-secondary text-secondary-foreground",
  aprovada: "bg-teal-soft text-teal",
  recusada: "bg-destructive/10 text-destructive",
};

function Solicitacoes() {
  const [rows, setRows] = useState<{ id: string; pet_id: string; shelter_id: string; status: string; created_at: string }[] | null>(null);
  useEffect(() => {
    fetchDbPets().then(() => supabase.from("adoption_requests").select("id, pet_id, shelter_id, status, created_at").order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? [])));
  }, []);
  return (
    <TabScreen>
      <TealHeader><div className="flex items-center gap-2"><Link to="/perfil" aria-label="Voltar"><ArrowLeft className="size-5" /></Link><h1 className="text-xl font-bold">Minhas solicitações</h1></div></TealHeader>
      <div className="space-y-3 p-4">
        {rows === null && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {rows?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Você ainda não enviou nenhuma solicitação.</p>}
        {rows?.map((r) => {
          const pet = getPet(r.pet_id);
          return (
            <Link key={r.id} to="/pet/$id" params={{ id: r.pet_id }} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
              {pet && <img src={pet.photos[0]} alt={pet.name} className="size-14 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1"><p className="font-semibold">{pet?.name ?? r.pet_id}</p><p className="truncate text-xs text-muted-foreground">{getShelter(r.shelter_id)?.name} · {new Date(r.created_at).toLocaleDateString("pt-BR")}</p></div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[r.status] ?? ""}`}>{r.status}</span>
            </Link>
          );
        })}
      </div>
    </TabScreen>
  );
}
