import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PhoneFrame, RequireAuth, ShelterNav, TealHeader } from "@/components/adopet/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { initials, shortTime, type ConvRow, type MsgRow } from "@/lib/chat";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mensagensdoador")({
  head: () => ({ meta: [
    { title: "Mensagens do abrigo — ADOPET" },
    { name: "description", content: "Conversas com pessoas interessadas nos animais do seu abrigo." },
    { property: "og:title", content: "Mensagens do abrigo — ADOPET" },
    { property: "og:description", content: "Conversas com pessoas interessadas nos animais do seu abrigo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <PhoneFrame>
      <RequireAuth role="abrigo">
        <main className="no-scrollbar animate-screen flex-1 overflow-y-auto"><Lista /></main>
        <ShelterNav />
      </RequireAuth>
    </PhoneFrame>
  ),
});

type Item = ConvRow & { last: MsgRow | undefined; unread: number };

function Lista() {
  const { user } = useApp();
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(false);
    const { data: convs, error: e1 } = await supabase.from("conversations").select("*").eq("abrigo_id", user.id).order("ultima_em", { ascending: false });
    if (e1) { setError(true); return; }
    const ids = (convs ?? []).map((c) => c.id);
    const { data: msgs, error: e2 } = ids.length ? await supabase.from("messages").select("*").in("conversa_id", ids).order("criada_em") : { data: [], error: null };
    if (e2) { setError(true); return; }
    setItems((convs ?? []).map((c) => {
      const mine = (msgs ?? []).filter((m) => m.conversa_id === c.id);
      return { ...c, last: mine.at(-1), unread: mine.filter((m) => !m.lida && m.remetente_id !== user.id).length };
    }));
  }, [user]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`abrigo-msgs-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return (
    <>
      <TealHeader><h1 className="text-xl font-bold">Mensagens</h1></TealHeader>
      {error ? (
        <div className="space-y-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar as conversas.</p>
          <Button variant="teal" onClick={load}>Tentar novamente</Button>
        </div>
      ) : items === null ? (
        <ul aria-busy="true" className="divide-y">
          {[0, 1, 2].map((i) => <li key={i} className="flex items-center gap-3 px-4 py-3"><div className="size-12 animate-pulse rounded-full bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-1/2 animate-pulse rounded bg-muted" /><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /></div></li>)}
        </ul>
      ) : items.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Quando alguém se interessar pelos seus animais, a conversa aparecerá aqui.</p>
      ) : (
        <ul className="divide-y">
          {items.map((c) => (
            <li key={c.id}>
              <Link to="/chat/$id" params={{ id: c.id }} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50", c.unread > 0 && "bg-teal-soft")}>
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-teal font-semibold text-teal-foreground">{initials(c.adotante_nome)}</span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate", c.unread > 0 ? "font-bold" : "font-semibold")}>{c.adotante_nome}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.last?.remetente_id === user?.id ? "Você: " : ""}{c.last?.texto || (c.last?.imagem_path ? "📷 Imagem" : `Sobre ${c.animal_nome}`)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  {shortTime(c.last?.criada_em ?? c.ultima_em)}
                  {c.unread > 0 && <span aria-label={`${c.unread} não lidas`} className="grid size-5 place-items-center rounded-full bg-heart text-[10px] font-bold text-primary-foreground">{c.unread}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
