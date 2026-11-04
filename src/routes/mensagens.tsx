import { createFileRoute } from "@tanstack/react-router";
import { TabScreen, TealHeader } from "@/components/adopet/AppShell";
import { getShelter } from "@/data/pets";
import { relativeTime, useApp } from "@/store/app-store";

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [
    { title: "Mensagens — ADOPET" },
    { name: "description", content: "Suas conversas com os abrigos." },
    { property: "og:title", content: "Mensagens — ADOPET" },
    { property: "og:description", content: "Suas conversas com os abrigos." },
  ] }),
  component: Mensagens,
});

function Mensagens() {
  const { conversations } = useApp();
  const list = Object.values(conversations).sort((a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0));
  return (
    <TabScreen>
      <TealHeader><h1 className="text-xl font-bold">Mensagens</h1></TealHeader>
      <ul className="divide-y">
        {list.map((c) => {
          const s = getShelter(c.shelterId);
          const last = c.messages.at(-1);
          return (
            <li key={c.shelterId} className="flex items-center gap-3 px-4 py-3">
              <img src={s.avatar} alt="" className="size-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="truncate text-sm text-muted-foreground">{last?.from === "me" ? "Você: " : ""}{last?.text}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                {last && relativeTime(last.at)}
                {c.unread > 0 && <span className="grid size-5 place-items-center rounded-full bg-heart text-primary-foreground">{c.unread}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </TabScreen>
  );
}
