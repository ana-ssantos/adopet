import type { Pet } from "@/data/pets";
import { getShelter } from "@/data/pets";
import type { Filters } from "@/store/app-store";

export type Category = "todos" | "caes" | "gatos" | "filhotes";

/** Regra de filtragem: busca (nome/raça/abrigo) + categoria + filtros avançados. */
export function filterPets(list: Pet[], query: string, category: Category, f: Filters): Pet[] {
  const q = query.trim().toLowerCase();
  return list.filter((p) => {
    if (q && ![p.name, p.breed, getShelter(p.shelterId).name].some((s) => s.toLowerCase().includes(q))) return false;
    if (category === "caes" && p.species !== "cao") return false;
    if (category === "gatos" && p.species !== "gato") return false;
    if (category === "filhotes" && p.ageYears >= 1) return false;
    if (f.species.length && !f.species.includes(p.species)) return false;
    if (f.sex.length && !f.sex.includes(p.sex)) return false;
    if (f.size.length && !f.size.includes(p.size)) return false;
    if (f.coat.length && !f.coat.includes(p.coat)) return false;
    if (f.vaccinated && !p.vaccinated) return false;
    if (f.dewormed && !p.dewormed) return false;
    if (f.neutered && !p.neutered) return false;
    if (p.ageYears < f.age[0] || p.ageYears > f.age[1]) return false;
    return true;
  });
}
