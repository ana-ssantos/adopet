import { supabase } from "@/integrations/supabase/client";

export interface ConvRow { id: string; abrigo_id: string; adotante_id: string; animal_id: string; abrigo_nome: string; adotante_nome: string; animal_nome: string; ultima_em: string }
export interface MsgRow { id: string; conversa_id: string; remetente_id: string; texto: string; criada_em: string; lida: boolean; imagem_path?: string | null }

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

/* ---------- anexo de imagem ---------- */
export const CHAT_BUCKET = "chat-images";
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_MB = 10;

/** Reduz a imagem (lado maior até 1280 px) e converte para JPEG antes de enviar. */
export async function shrinkImage(file: File, max = 1280): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("conversão falhou"))), "image/jpeg", 0.82));
}

/** Envia a imagem para a pasta da conversa e devolve o caminho salvo na mensagem. */
export async function uploadChatImage(convId: string, blob: Blob): Promise<string> {
  const path = `${convId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(CHAT_BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Links temporários (1 h) para exibir as imagens do bucket privado. */
export async function signedImageUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!paths.length) return out;
  const { data } = await supabase.storage.from(CHAT_BUCKET).createSignedUrls(paths, 3600);
  data?.forEach((d) => { if (d.path && d.signedUrl) out[d.path] = d.signedUrl; });
  return out;
}
