import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { TabScreen } from "@/components/adopet/AppShell";
import { FavButton } from "@/components/adopet/bits";
import { coatLabel, formatAge, getPet, getShelter, sexLabel, sizeLabel } from "@/data/pets";

export const Route = createFileRoute("/pet/$id")({
  head: () => ({ meta: [
    { title: "Detalhes do pet — ADOPET" },
    { name: "description", content: "Conheça o pet, sua saúde, personalidade e abrigo." },
    { property: "og:title", content: "Detalhes do pet — ADOPET" },
    { property: "og:description", content: "Conheça o pet, sua saúde, personalidade e abrigo." },
  ] }),
  component: PetPage,
});

function PetPage() {
  const { id } = Route.useParams();
  const pet = getPet(id);
  if (!pet) return <TabScreen><p className="p-6">Pet não encontrado.</p></TabScreen>;
  const s = getShelter(pet.shelterId);
  const yes = (b: boolean) => (b ? "Sim" : "Não");
  return (
    <TabScreen>
      <div className="relative">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {pet.photos.map((src, i) => <img key={src} src={src} alt={`${pet.name} foto ${i + 1}`} className="aspect-square w-full shrink-0 snap-center object-cover" />)}
        </div>
        <Link to="/" aria-label="Voltar" className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-card shadow-card"><ArrowLeft className="size-5" /></Link>
        <FavButton petId={pet.id} className="absolute right-3 top-3" />
      </div>
      <div className="space-y-4 p-5">
        <div><h1 className="text-2xl font-bold">{pet.name}</h1><p className="text-sm text-muted-foreground">{pet.breed} · {formatAge(pet.ageYears)}</p></div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {[["Porte", sizeLabel[pet.size]], ["Pelagem", coatLabel[pet.coat]], ["Sexo", sexLabel[pet.sex]], ["Vacinado", yes(pet.vaccinated)], ["Vermifugado", yes(pet.dewormed)], ["Castrado", yes(pet.neutered)]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-card p-3 shadow-card"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
        <p className="text-sm">{pet.personality}</p>
        <div className="rounded-xl bg-teal-soft p-3 text-sm text-teal"><p className="font-semibold">{s.name}</p><p>{s.city} · {s.phone}</p></div>
      </div>
    </TabScreen>
  );
}
