import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { TabScreen, TealHeader } from "@/components/adopet/AppShell";
import { EmptyState, PetCard } from "@/components/adopet/bits";
import { pets } from "@/data/pets";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [
    { title: "Favoritos — ADOPET" },
    { name: "description", content: "Os pets que você favoritou no ADOPET." },
    { property: "og:title", content: "Favoritos — ADOPET" },
    { property: "og:description", content: "Os pets que você favoritou no ADOPET." },
  ] }),
  component: Favoritos,
});

function Favoritos() {
  const { favorites } = useApp();
  const list = pets.filter((p) => favorites.includes(p.id));
  return (
    <TabScreen>
      <TealHeader><h1 className="text-xl font-bold">Favoritos</h1></TealHeader>
      {list.length === 0 ? (
        <EmptyState icon={<Heart className="size-9" />} title="Nenhum favorito ainda" text="Toque no coração de um pet para salvá-lo aqui." />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">{list.map((p) => <PetCard key={p.id} pet={p} />)}</div>
      )}
    </TabScreen>
  );
}
