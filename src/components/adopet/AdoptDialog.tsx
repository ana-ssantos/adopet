import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/adopet/bits";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/store/app-store";
import type { Pet } from "@/data/pets";

/** Botão "Quero adotar" + formulário de solicitação (uma por pet por usuário). */
export function AdoptButton({ pet }: { pet: Pet }) {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [already, setAlready] = useState<boolean | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", housing: "", has_other_pets: "", reason: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, phone: f.phone || user.phone }));
    supabase.from("adoption_requests").select("id").eq("pet_id", pet.id).maybeSingle().then(({ data }) => setAlready(!!data));
  }, [user, pet.id]);

  if (!user) return <Button asChild size="lg" className="w-full"><Link to="/login">Quero adotar</Link></Button>;
  if (already) return <Button asChild size="lg" variant="tealSoft" className="w-full"><Link to="/solicitacoes">Solicitação enviada · ver status</Link></Button>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = "Informe seu nome";
    if (form.phone.replace(/\D/g, "").length < 10) er.phone = "Telefone inválido";
    if (!form.housing) er.housing = "Escolha o tipo de moradia";
    if (!form.has_other_pets) er.has_other_pets = "Responda esta pergunta";
    if (form.reason.trim().length < 10) er.reason = "Conte um pouco mais (mín. 10 caracteres)";
    else if (form.reason.length > 1000) er.reason = "Máximo de 1000 caracteres";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSending(true);
    const { error } = await supabase.from("adoption_requests").insert({
      user_id: user.id, pet_id: pet.id, shelter_id: pet.shelterId, name: form.name.trim(), phone: form.phone.trim(),
      housing: form.housing, has_other_pets: form.has_other_pets === "sim", reason: form.reason.trim(),
    });
    setSending(false);
    if (error) {
      if (error.code === "23505") { setAlready(true); setOpen(false); toast.info("Você já enviou uma solicitação para este pet"); return; }
      toast.error("Não foi possível enviar. Tente novamente."); return;
    }
    setAlready(true); setOpen(false);
    toast.success("Solicitação enviada!", { description: "Acompanhe em Perfil › Minhas solicitações" });
  };

  const radio = (key: "housing" | "has_other_pets", opts: [string, string][]) => (
    <div className="flex flex-wrap gap-2">
      {opts.map(([v, l]) => (
        <label key={v} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${form[key] === v ? "border-teal bg-teal-soft text-teal" : ""}`}>
          <input type="radio" name={key} value={v} checked={form[key] === v} onChange={() => setForm({ ...form, [key]: v })} className="sr-only" />{l}
        </label>
      ))}
    </div>
  );

  return (
    <>
      <Button size="lg" className="w-full" disabled={already === null} onClick={() => setOpen(true)}>Quero adotar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] max-w-[350px] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>Adotar {pet.name}</DialogTitle><DialogDescription>O abrigo vai analisar sua solicitação.</DialogDescription></DialogHeader>
          <form onSubmit={submit} noValidate className="space-y-3">
            <Field label="Nome" name="name" value={form.name} maxLength={100} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="Telefone" name="phone" type="tel" value={form.phone} maxLength={20} error={errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="space-y-1.5"><p className="text-sm font-medium">Tipo de moradia</p>{radio("housing", [["casa", "Casa"], ["apartamento", "Apartamento"], ["outro", "Outro"]])}{errors.housing && <p className="text-xs text-destructive">{errors.housing}</p>}</div>
            <div className="space-y-1.5"><p className="text-sm font-medium">Já tem outros animais?</p>{radio("has_other_pets", [["sim", "Sim"], ["nao", "Não"]])}{errors.has_other_pets && <p className="text-xs text-destructive">{errors.has_other_pets}</p>}</div>
            <div className="space-y-1.5"><label htmlFor="reason" className="text-sm font-medium">Por que quer adotar?</label><Textarea id="reason" rows={3} maxLength={1000} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />{errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}</div>
            <Button type="submit" className="w-full" disabled={sending}>{sending ? "Enviando..." : "Enviar solicitação"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
