import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { dbPets, type Pet } from "@/data/pets";
import { useApp } from "@/store/app-store";

/**
 * "Conversar com o abrigo": abre a conversa existente sobre este pet ou cria uma nova.
 * O banco preenche nomes e dono do abrigo e envia a mensagem de boas-vindas (gatilhos).
 */
export function ChatButton({ pet }: { pet: Pet }) {
  const { user } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!user) {
    return <Button asChild size="lg" variant="tealSoft" className="w-full"><Link to="/login"><MessageCircle className="size-4" /> Conversar com o abrigo</Link></Button>;
  }

  const open = async () => {
    // Os pets de demonstração (Thor, Max...) não existem no banco, então não têm chat.
    if (!dbPets.has(pet.id)) {
      toast.info("Este é um pet de demonstração", { description: "O chat funciona com os pets cadastrados pelos abrigos." });
      return;
    }
    setBusy(true);
    const find = () => supabase.from("conversations").select("id").eq("adotante_id", user.id).eq("animal_id", pet.id).maybeSingle();
    let conv = (await find()).data;
    if (!conv) {
      const { data, error } = await supabase.from("conversations").insert({ animal_id: pet.id, abrigo_id: pet.shelterId }).select("id").single();
      if (!error) conv = data;
      else if (error.code === "23505") conv = (await find()).data; // criada em paralelo
    }
    setBusy(false);
    if (!conv) { toast.error("Não foi possível abrir a conversa. Tente novamente."); return; }
    navigate({ to: "/chat/$id", params: { id: conv.id } });
  };

  return (
    <Button size="lg" variant="tealSoft" className="w-full" disabled={busy} onClick={open}>
      <MessageCircle className="size-4" /> {busy ? "Abrindo..." : "Conversar com o abrigo"}
    </Button>
  );
}
