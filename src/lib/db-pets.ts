import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dbPets, dbShelters, shelters, type Coat, type Pet, type Sex, type Size, type Species } from "@/data/pets";
import placeholder from "@/assets/pets/shelter-apc.jpg";
import type { Tables } from "@/integrations/supabase/types";

type Row = Tables<"pets">;

/** Converte uma linha do banco em Pet e registra o abrigo dono. */
export function rowToPet(r: Row, photo?: string): Pet {
  if (!dbShelters.has(r.shelter_user_id))
    dbShelters.set(r.shelter_user_id, { id: r.shelter_user_id, name: r.shelter_name || "Abrigo", short: r.shelter_name || "Abrigo", city: r.shelter_city, phone: r.shelter_phone, avatar: shelters[0]?.avatar ?? placeholder });
  const pet: Pet = {
    id: r.id, name: r.name, species: r.species as Species, breed: r.breed, ageYears: Number(r.age_years), size: r.size as Size,
    coat: r.coat as Coat, sex: r.sex as Sex, vaccinated: r.vaccinated, dewormed: r.dewormed, neutered: r.neutered,
    shelterId: r.shelter_user_id, personality: r.personality, photos: [photo ?? placeholder],
    status: r.status === "em_processo" ? "em_processo" : r.status === "adotado" ? "adotado" : "disponivel",
  };
  dbPets.set(pet.id, pet);
  return pet;
}

/**
 * Busca pets do banco com fotos assinadas.
 * Sem `ownerId` é a tela inicial dos tutores: pets já adotados ficam de fora.
 * Use `includeAdopted` quando precisar do nome/foto de um pet adotado (ex.: histórico de solicitações).
 */
export async function fetchDbPets(ownerId?: string, includeAdopted = false): Promise<Pet[]> {
  let q = supabase.from("pets").select("*").order("created_at", { ascending: false });
  if (ownerId) q = q.eq("shelter_user_id", ownerId);
  else if (!includeAdopted) q = q.neq("status", "adotado");
  const { data } = await q;
  const rows = data ?? [];
  const paths = rows.map((r) => r.photo_url).filter((x): x is string => !!x);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("pet-photos").createSignedUrls(paths, 60 * 60 * 24);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  return rows.map((r) => rowToPet(r, r.photo_url ? urls.get(r.photo_url) : undefined));
}

export function useDbPets(ownerId?: string) {
  const [list, setList] = useState<Pet[] | null>(null);
  const reload = useCallback(() => { fetchDbPets(ownerId).then(setList); }, [ownerId]);
  useEffect(reload, [reload]);
  // Atualiza a lista quando um abrigo muda o status de um pet (ex.: doação concluída)
  useEffect(() => {
    const ch = supabase.channel(`pets-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pets" }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [reload]);
  return { list, reload };
}
