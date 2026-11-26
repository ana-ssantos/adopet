import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { PhoneFrame, RequireAuth } from "@/components/adopet/AppShell";
import { Chip, SearchBar } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { coatLabel, sexLabel, sizeLabel, type Coat, type Sex, type Size, type Species } from "@/data/pets";
import { emptyFilters, useApp, type Filters } from "@/store/app-store";
import { activeFilterChips } from "./index";

export const Route = createFileRoute("/filtro")({
  head: () => ({ meta: [
    { title: "Filtros — ADOPET" },
    { name: "description", content: "Filtre pets por saúde, idade, porte, espécie, sexo e pelagem." },
    { property: "og:title", content: "Filtros — ADOPET" },
    { property: "og:description", content: "Filtre pets por saúde, idade, porte, espécie, sexo e pelagem." },
  ] }),
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({ q: typeof s.q === "string" && s.q ? s.q : undefined }),
  component: FiltroPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
      <h2 className="mb-1 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="size-5 data-[state=checked]:bg-teal data-[state=checked]:border-teal" />
      {label}
    </label>
  );
}

function FiltroPage() {
  const { filters, setFilters } = useApp();
  const navigate = useNavigate();
  const { q: q0 } = Route.useSearch();
  const [d, setD] = useState<Filters>(filters); // rascunho: só aplica ao confirmar
  const [text, setText] = useState(q0 ?? ""); // busca também é rascunho

  const toggle = <K extends "species" | "sex" | "size" | "coat">(k: K, v: Filters[K][number]) =>
    setD((x) => {
      const arr = x[k] as string[];
      return { ...x, [k]: arr.includes(v) ? arr.filter((y) => y !== v) : [...arr, v] };
    });

  const back = (q?: string) => navigate({ to: "/", search: { q: q || undefined } });
  const chips = activeFilterChips(d);

  return (
    <PhoneFrame>
      <RequireAuth>
        <header className="space-y-3 bg-teal px-4 py-5 text-teal-foreground">
          <div className="flex items-center gap-3">
            <button onClick={() => back(q0)} aria-label="Voltar" className="rounded-full p-1 hover:bg-teal-foreground/10"><ArrowLeft className="size-5" /></button>
            <h1 className="flex-1 text-lg font-bold">Filtros</h1>
            <button onClick={() => { setD(emptyFilters); setText(""); }} className="text-sm font-medium text-brand-sand hover:underline">Limpar tudo</button>
          </div>
          <SearchBar value={text} onChange={setText} />
        </header>
        <main className="no-scrollbar animate-screen flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex min-h-8 flex-wrap gap-2">
            {chips.length ? chips.map((c) => <Chip key={c.label} onRemove={() => setD(c.remove(d))}>{c.label}</Chip>) : <p className="text-sm text-muted-foreground">Nenhum filtro selecionado.</p>}
          </div>
          <Section title="Saúde">
            <Check label="Vacinado" checked={d.vaccinated} onChange={(v) => setD({ ...d, vaccinated: v })} />
            <Check label="Vermifugado" checked={d.dewormed} onChange={(v) => setD({ ...d, dewormed: v })} />
            <Check label="Castrado" checked={d.neutered} onChange={(v) => setD({ ...d, neutered: v })} />
          </Section>
          <Section title="Idade">
            <div className="flex justify-between text-sm"><span>{d.age[0]} {d.age[0] === 1 ? "ano" : "anos"}</span><span className="font-semibold text-teal">{d.age[0]} – {d.age[1]} anos</span><span>{d.age[1]} anos</span></div>
            <Slider min={0} max={15} step={1} value={d.age} onValueChange={(v) => setD({ ...d, age: [v[0] ?? 0, v[1] ?? 15] as [number, number] })} aria-label="Faixa de idade" className="py-2" />
          </Section>
          <Section title="Tamanho">
            {(Object.keys(sizeLabel) as Size[]).map((s) => <Check key={s} label={sizeLabel[s]} checked={d.size.includes(s)} onChange={() => toggle("size", s)} />)}
          </Section>
          <Section title="Espécie">
            <div className="flex gap-2">{(["cao", "gato"] as Species[]).map((s) => <Chip key={s} active={d.species.includes(s)} onClick={() => toggle("species", s)}>{s === "cao" ? "Cão" : "Gato"}</Chip>)}</div>
          </Section>
          <Section title="Sexo">
            <div className="flex gap-2">{(Object.keys(sexLabel) as Sex[]).map((s) => <Chip key={s} active={d.sex.includes(s)} onClick={() => toggle("sex", s)}>{sexLabel[s]}</Chip>)}</div>
          </Section>
          <Section title="Tipo de pelo">
            <div className="flex flex-wrap gap-2">{(Object.keys(coatLabel) as Coat[]).map((s) => <Chip key={s} active={d.coat.includes(s)} onClick={() => toggle("coat", s)}>{coatLabel[s]}</Chip>)}</div>
          </Section>
        </main>
        <footer className="grid grid-cols-2 gap-3 border-t bg-card p-4">
          <Button variant="tealSoft" size="lg" onClick={() => back(q0)}>Cancelar</Button>
          <Button size="lg" onClick={() => { setFilters(d); back(text.trim()); }}>Adicionar Filtros</Button>
        </footer>
      </RequireAuth>
    </PhoneFrame>
  );
}
