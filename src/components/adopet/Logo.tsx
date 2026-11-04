import { Heart, PawPrint } from "lucide-react";

/** Logo ADOPET: coração + pata, texto em tons de bege/laranja. */
export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  const icon = size === "lg" ? "size-10" : size === "sm" ? "size-6" : "size-7";
  return (
    <div className="flex items-center gap-2" aria-label="ADOPET">
      <span className={`relative inline-flex ${icon}`}>
        <Heart className="size-full fill-brand-orange text-brand-orange" />
        <PawPrint className="absolute -right-1 -top-1 size-1/2 text-brand-sand" />
      </span>
      <span className={`${text} font-extrabold tracking-tight`}>
        <span className="text-brand-sand">ADO</span>
        <span className="text-brand-orange">PET</span>
      </span>
    </div>
  );
}
