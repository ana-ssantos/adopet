import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/store/app-store";

/**
 * Total de mensagens não lidas que o usuário logado recebeu.
 * Atualiza em tempo real; as regras de segurança do banco já limitam o resultado
 * às conversas das quais o usuário participa.
 */
export function useUnreadCount(): number {
  const { user } = useApp();
  const uid = user?.id;
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!uid) { setCount(0); return; }
    const { count: n } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("lida", false)
      .neq("remetente_id", uid);
    setCount(n ?? 0);
  }, [uid]);

  useEffect(() => {
    load();
    if (!uid) return;
    const ch = supabase.channel(`unread-${uid}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, load]);

  return count;
}
