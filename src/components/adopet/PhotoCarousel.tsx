import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Carrossel de fotos: rolagem por toque, setas, pontos e teclado (← →). */
export function PhotoCarousel({ photos, name }: { photos: string[]; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const many = photos.length > 1;

  const go = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-card transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  return (
    <div className="relative" role="group" aria-roledescription="carrossel" aria-label={`Fotos de ${name}`}>
      <div
        ref={ref}
        tabIndex={many ? 0 : undefined}
        onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {photos.map((src, i) => (
          <img key={src} src={src} alt={`${name} foto ${i + 1} de ${photos.length}`} className="aspect-square w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {many && (
        <>
          <button type="button" aria-label="Foto anterior" disabled={idx === 0} onClick={() => go(-1)} className={cn(arrow, "left-2")}><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label="Próxima foto" disabled={idx === photos.length - 1} onClick={() => go(1)} className={cn(arrow, "right-2")}><ChevronRight className="size-5" /></button>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {photos.map((_, i) => <span key={i} className={cn("size-2 rounded-full transition-colors", i === idx ? "bg-card" : "bg-card/50")} />)}
          </div>
          <p className="sr-only" aria-live="polite">Foto {idx + 1} de {photos.length}</p>
        </>
      )}
    </div>
  );
}
