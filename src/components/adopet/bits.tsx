import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAge, getShelter, type Pet } from "@/data/pets";
import { useApp } from "@/store/app-store";

/** Chip de seleção/filtro. */
export function Chip({ active, onClick, children, onRemove }: { active?: boolean; onClick?: () => void; children: ReactNode; onRemove?: () => void }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full text-sm font-medium transition-all",
        active ? "bg-teal text-teal-foreground shadow-sm" : "bg-muted text-foreground",
      )}
    >
      <button type="button" onClick={onClick} aria-pressed={active} className="rounded-full px-4 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {children}
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remover filtro ${children}`} className="-ml-2 mr-1.5 rounded-full p-0.5 hover:bg-foreground/10">
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

/** Campo com label e mensagem de erro. */
export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined; right?: ReactNode }>(
  ({ label, error, right, id, className, ...props }, ref) => {
    const fid = id ?? props.name;
    return (
      <div className="space-y-1">
        <label htmlFor={fid} className="text-sm font-medium">{label}</label>
        <div className="relative">
          <input
            ref={ref}
            id={fid}
            aria-invalid={!!error}
            aria-describedby={error ? `${fid}-err` : undefined}
            className={cn(
              "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/25 aria-[invalid=true]:border-destructive",
              right && "pr-11",
              className,
            )}
            {...props}
          />
          {right && <div className="absolute inset-y-0 right-1 flex items-center">{right}</div>}
        </div>
        {error && <p id={`${fid}-err`} className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Field.displayName = "Field";

/** Barra de busca + botão de filtro com contador. */
export function SearchBar({ value, onChange, filterCount, onFilter }: { value: string; onChange: (v: string) => void; filterCount?: number; onFilter?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-card px-3 text-foreground shadow-card focus-within:ring-2 focus-within:ring-brand-sand">
        <Search className="size-4 text-muted-foreground" aria-hidden />
        <span className="sr-only">Pesquisar</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Pesquisar..." className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        {value && (
          <button type="button" aria-label="Limpar busca" onClick={() => onChange("")}><X className="size-4 text-muted-foreground" /></button>
        )}
      </label>
      {onFilter && (
        <button type="button" onClick={onFilter} aria-label={`Filtros${filterCount ? ` (${filterCount} ativos)` : ""}`} className="relative grid size-11 place-items-center rounded-xl bg-card text-foreground shadow-card transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sand">
          <SlidersHorizontal className="size-5" />
          {!!filterCount && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-orange text-[11px] font-bold text-primary">{filterCount}</span>}
        </button>
      )}
    </div>
  );
}

export function FavButton({ petId, className }: { petId: string; className?: string }) {
  const { favorites, toggleFavorite } = useApp();
  const fav = favorites.includes(petId);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(petId); }}
      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={fav}
      className={cn("grid size-9 place-items-center rounded-full bg-card/90 shadow-card backdrop-blur transition hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      <Heart className={cn("size-5 transition-colors", fav ? "fill-heart text-heart" : "text-foreground")} />
    </button>
  );
}

export function PetCard({ pet }: { pet: Pet }) {
  const shelter = getShelter(pet.shelterId);
  return (
    <article className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-0.5">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={pet.photos[0]} alt={`Foto de ${pet.name}`} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        <FavButton petId={pet.id} className="absolute right-2 top-2" />
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold">{pet.name}</h3>
          <span className="text-xs text-muted-foreground">{formatAge(pet.ageYears)}</span>
        </div>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">{shelter.short} - RJ</p>
        <Link to="/pet/$id" params={{ id: pet.id }} className="mt-1 block rounded-lg bg-teal-soft py-1.5 text-center text-xs font-semibold text-teal transition hover:bg-teal hover:text-teal-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Saiba Mais...
        </Link>
      </div>
    </article>
  );
}

export function PetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-7 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-teal-soft text-teal">{icon}</div>
      <h2 className="text-lg font-bold">{title}</h2>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      {action}
    </div>
  );
}
