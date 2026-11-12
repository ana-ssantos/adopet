import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchX } from "lucide-react";
import { TabScreen, TealHeader } from "@/components/adopet/AppShell";
import { Logo } from "@/components/adopet/Logo";
import { Chip, EmptyState, PetCard, PetCardSkeleton, SearchBar } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { coatLabel, pets, sexLabel, sizeLabel } from "@/data/pets";
import { countFilters, emptyFilters, useApp, type Filters } from "@/store/app-store";
import { filterPets, type Category } from "@/lib/filter-pets";
import { useDbPets } from "@/lib/db-pets";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ADOPET — Cães e gatos para adoção no RJ" },
    { name: "description", content: "Navegue por cães e gatos de abrigos do Rio de Janeiro, filtre e favorite." },
    { property: "og:title", content: "ADOPET — Cães e gatos para adoção no RJ" },
    { property: "og:description", content: "Navegue por cães e gatos de abrigos do Rio de Janeiro, filtre e favorite." },
  ] }),
  component: Home,
});

const cats: { id: Category; label: string }[] = [
  { id: "todos", label: "Todos" }, { id: "caes", label: "Cães" }, { id: "gatos", label: "Gatos" }, { id: "filhotes", label: "Filhotes" },
];
const PAGE = 6;

/** Lista legível dos filtros ativos, cada um com função de remoção. */
export function activeFilterChips(f: Filters): { label: string; remove: (f: Filters) => Filters }[] {
  const out: { label: string; remove: (f: Filters) => Filters }[] = [];
  if (f.vaccinated) out.push({ label: "Vacinado", remove: (x) => ({ ...x, vaccinated: false }) });
  if (f.dewormed) out.push({ label: "Vermifugado", remove: (x) => ({ ...x, dewormed: false }) });
  if (f.neutered) out.push({ label: "Castrado", remove: (x) => ({ ...x, neutered: false }) });
  f.species.forEach((s) => out.push({ label: s === "cao" ? "Cão" : "Gato", remove: (x) => ({ ...x, species: x.species.filter((y) => y !== s) }) }));
  f.sex.forEach((s) => out.push({ label: sexLabel[s], remove: (x) => ({ ...x, sex: x.sex.filter((y) => y !== s) }) }));
  f.size.forEach((s) => out.push({ label: sizeLabel[s], remove: (x) => ({ ...x, size: x.size.filter((y) => y !== s) }) }));
  f.coat.forEach((s) => out.push({ label: coatLabel[s], remove: (x) => ({ ...x, coat: x.coat.filter((y) => y !== s) }) }));
  if (f.age[0] !== 0 || f.age[1] !== 15) out.push({ label: `${f.age[0]}–${f.age[1]} anos`, remove: (x) => ({ ...x, age: [0, 15] }) });
  return out;
}

function Home() {
  const { filters, setFilters } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category>("todos");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  // Skeleton breve ao entrar/trocar categoria (simula carregamento)
  useEffect(() => { setLoading(true); setVisible(PAGE); const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, [cat]);

  const { list: fromDb } = useDbPets();
  const list = useMemo(() => filterPets([...(fromDb ?? []), ...pets], q, cat, filters), [fromDb, q, cat, filters]);

  // Rolagem infinita
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) setVisible((v) => v + PAGE); });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, list.length]);

  const chips = activeFilterChips(filters);
  const n = countFilters(filters);

  return (
    <TabScreen>
      <TealHeader>
        <div className="mb-4 flex justify-center"><Logo /></div>
        <SearchBar value={q} onChange={setQ} filterCount={n} onFilter={() => navigate({ to: "/filtro" })} />
      </TealHeader>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-4">
        {cats.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>)}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
          {chips.map((c) => <Chip key={c.label} active onRemove={() => setFilters(c.remove(filters))}>{c.label}</Chip>)}
          <button onClick={() => setFilters(emptyFilters)} className="text-xs font-semibold text-teal underline-offset-2 hover:underline">Limpar tudo</button>
        </div>
      )}
      <div className="px-4 pb-6 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <PetCardSkeleton key={i} />)}</div>
        ) : list.length === 0 ? (
          <EmptyState icon={<SearchX className="size-9" />} title="Nenhum pet encontrado" text="Tente outra busca ou remova alguns filtros."
            action={<Button variant="tealSoft" onClick={() => { setQ(""); setCat("todos"); setFilters(emptyFilters); }}>Limpar busca e filtros</Button>} />
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">{list.length} {list.length === 1 ? "pet disponível" : "pets disponíveis"}</p>
            <div className="grid grid-cols-2 gap-3">{list.slice(0, visible).map((p) => <PetCard key={p.id} pet={p} />)}</div>
            {visible < list.length && <div ref={sentinel} className="grid grid-cols-2 gap-3 pt-3"><PetCardSkeleton /><PetCardSkeleton /></div>}
          </>
        )}
      </div>
    </TabScreen>
  );
}
