import { describe, expect, it } from "vitest";
import { pets } from "@/data/pets";
import { filterPets } from "@/lib/filter-pets";
import { countFilters, emptyFilters } from "@/store/app-store";

describe("filtro de pets", () => {
  it("Filhotes mostra só pets com menos de 1 ano", () => {
    const r = filterPets(pets, "", "filhotes", emptyFilters);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.ageYears < 1)).toBe(true);
  });
  it("busca encontra por nome do abrigo", () => {
    const r = filterPets(pets, "patinhas", "todos", emptyFilters);
    expect(r.map((p) => p.id)).toContain("thor");
    expect(r.map((p) => p.id)).not.toContain("max");
  });
  it("Vacinado exclui pets não vacinados", () => {
    const r = filterPets(pets, "", "todos", { ...emptyFilters, vaccinated: true });
    expect(r.map((p) => p.id)).not.toContain("simba");
  });
  it("conta filtros ativos", () => {
    expect(countFilters({ ...emptyFilters, vaccinated: true, size: ["medio"], age: [1, 15] })).toBe(3);
  });
});
