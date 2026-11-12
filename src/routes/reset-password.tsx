import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PhoneFrame } from "@/components/adopet/AppShell";
import { Field } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/store/app-store";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Nova senha — ADOPET" },
    { name: "description", content: "Defina uma nova senha para sua conta ADOPET." },
    { property: "og:title", content: "Nova senha — ADOPET" },
    { property: "og:description", content: "Defina uma nova senha para sua conta ADOPET." },
  ] }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
  const errors = validatePassword(password, confirm);
  return (
    <PhoneFrame>
      <form noValidate className="m-4 mt-12 space-y-4 rounded-2xl bg-card p-5 shadow-card" onSubmit={async (e) => {
        e.preventDefault(); setSent(true);
        if (Object.keys(errors).length) return;
        const { error } = await supabase.auth.updateUser({ password: password.trim() });
        if (error) return void toast.error("Link expirado ou inválido. Solicite outro.");
        toast.success("Senha atualizada!");
        navigate({ to: "/login" });
      }}>
        <h1 className="text-center text-xl font-bold">Definir nova senha</h1>
        <Field label="Nova senha" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={sent ? errors.password : undefined} />
        <Field label="Confirmar senha" name="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={sent ? errors.confirm : undefined} />
        <Button type="submit" size="lg" className="w-full">Salvar</Button>
      </form>
    </PhoneFrame>
  );
}
