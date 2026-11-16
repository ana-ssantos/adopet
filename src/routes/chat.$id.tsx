import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, MoreVertical, Paperclip, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/adopet/AppShell";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { initials, markRead, type ConvRow, type MsgRow } from "@/lib/chat";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({ meta: [
    { title: "Conversa — ADOPET" },
    { name: "description", content: "Converse sobre a adoção de um animal." },
    { property: "og:title", content: "Conversa — ADOPET" },
    { property: "og:description", content: "Converse sobre a adoção de um animal." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Chat,
});

const quick = ["Sim, isso mesmo", "Me fale sobre a personalidade dele", "Podemos agendar uma visita?"];
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function Chat() {
  const { id } = Route.useParams();
  const { ready, user } = useApp();
  const [conv, setConv] = useState<ConvRow | null | undefined>(undefined);
  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: c } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
    setConv(c ?? null);
    if (!c) return;
    const { data } = await supabase.from("messages").select("*").eq("conversa_id", id).order("criada_em");
    setMsgs(data ?? []);
    markRead(id, user.id);
  }, [id, user]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`chat-${id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversa_id=eq.${id}` }, (p) => {
        const m = p.new as MsgRow;
        setMsgs((all) => (all.some((x) => x.id === m.id) ? all : [...all, m]));
        if (user && m.remetente_id !== user.id) markRead(id, user.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, load, user]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async (t: string) => {
    const texto = t.trim();
    if (!texto || !user || sending) return;
    setSending(true);
    const { data, error } = await supabase.from("messages").insert({ conversa_id: id, texto, remetente_id: user.id }).select().single();
    setSending(false);
    if (error) { toast.error("Não foi possível enviar. Tente novamente."); return; }
    setText("");
    setMsgs((all) => (all.some((x) => x.id === data.id) ? all : [...all, data]));
  };

  const isShelter = user?.role === "abrigo";
  const other = conv ? (isShelter ? conv.adotante_nome : conv.abrigo_nome) : "";
  const back = isShelter ? "/mensagensdoador" : "/mensagens";

  if (ready && !user) return <PhoneFrame><div className="grid flex-1 place-items-center p-6 text-center"><p>Entre para ver esta conversa. <Link to="/login" className="font-semibold text-teal underline">Fazer login</Link></p></div></PhoneFrame>;

  return (
    <PhoneFrame>
      <header className="flex items-center gap-2 bg-teal px-3 py-3 text-teal-foreground">
        <Link to={back} aria-label="Voltar" className="rounded-full p-2 hover:bg-primary-foreground/10"><ArrowLeft className="size-5" /></Link>
        <span className="grid size-9 place-items-center rounded-full bg-teal-soft text-sm font-semibold text-teal">{initials(other)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{other || "Conversa"}</p>
          {conv && <p className="truncate text-xs opacity-80">Sobre {conv.animal_nome}</p>}
        </div>
        <button type="button" aria-label="Anexar" onClick={() => toast("Envio de anexos em breve.")} className="rounded-full p-2 hover:bg-primary-foreground/10"><Paperclip className="size-5" /></button>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Mais opções" className="rounded-full p-2 hover:bg-primary-foreground/10"><MoreVertical className="size-5" /></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setProfile(true)}>{isShelter ? "Ver perfil do interessado" : "Ver dados do abrigo"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-muted/40 px-3 py-4">
        {conv === undefined && <p className="text-center text-sm text-muted-foreground" aria-busy="true">Carregando…</p>}
        {conv === null && <p className="text-center text-sm text-muted-foreground">Conversa não encontrada.</p>}
        {msgs.map((m) => {
          const mine = m.remetente_id === user?.id;
          return (
            <div key={m.id} className={cn("flex items-end gap-2", mine && "justify-end")}>
              {!mine && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-teal text-[10px] font-semibold text-teal-foreground">{initials(other)}</span>}
              <div className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm", mine ? "rounded-br-sm bg-teal text-teal-foreground" : "rounded-bl-sm bg-card")}>
                <p className="whitespace-pre-wrap break-words">{m.texto}</p>
                <p className={cn("mt-1 text-right text-[10px]", mine ? "opacity-80" : "text-muted-foreground")}>{hhmm(m.criada_em)}</p>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </main>

      {conv && (
        <div className="border-t bg-card px-3 pb-3 pt-2">
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {quick.map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-teal px-3 py-1 text-xs font-medium text-teal hover:bg-teal-soft">{q}</button>
            ))}
          </div>
          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <input aria-label="Mensagem" value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite sua mensagem"
              className="h-11 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <Button type="submit" size="icon" variant="teal" className="size-11 rounded-full" disabled={!text.trim() || sending} aria-label="Enviar"><SendHorizontal className="size-5" /></Button>
          </form>
        </div>
      )}

      <Dialog open={profile} onOpenChange={setProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{other}</DialogTitle>
            <DialogDescription>{isShelter ? `Interessado(a) em adotar ${conv?.animal_nome ?? ""}.` : `Abrigo responsável por ${conv?.animal_nome ?? ""}.`}</DialogDescription>
          </DialogHeader>
          {isShelter && <Link to="/painel-abrigo" className="text-sm font-semibold text-teal underline">Ver solicitação no painel</Link>}
        </DialogContent>
      </Dialog>
    </PhoneFrame>
  );
}
