import { supabase } from "@/integrations/supabase/client";

export interface ConvRow { id: string; abrigo_id: string; adotante_id: string; animal_id: string; abrigo_nome: string; adotante_nome: string; animal_nome: string; ultima_em: string }
export interface MsgRow { id: string; conversa_id: string; remetente_id: string; texto: string; criada_em: string; lida: boolean }

/** "agora", "10 min", "2 h", "ontem" ou data curta. */
export function shortTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "agora";
  if (diff < 60) return `${Math.floor(diff)} min`;
  if (diff < 24 * 60) return `${Math.floor(diff / 60)} h`;
  if (diff < 48 * 60) return "ontem";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

export async function markRead(convId: string, me: string) {
  await supabase.from("messages").update({ lida: true }).eq("conversa_id", convId).neq("remetente_id", me).eq("lida", false);
}
