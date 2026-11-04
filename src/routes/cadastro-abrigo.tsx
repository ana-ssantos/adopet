import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PhoneFrame } from "@/components/adopet/AppShell";
import { Field } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { maskPhone } from "./cadastro";

export const Route = createFileRoute("/cadastro-abrigo")({
  head: () => ({ meta: [
    { title: "Cadastro de abrigo ou doador — ADOPET" },
    { name: "description", content: "Cadastre seu abrigo ou ofereça um pet para doação no ADOPET." },
    { property: "og:title", content: "Cadastro de abrigo ou doador — ADOPET" },
    { property: "og:description", content: "Cadastre seu abrigo ou ofereça um pet para doação no ADOPET." },
  ] }),
  component: CadastroAbrigo,
});

function CadastroAbrigo() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", cnpj: "", email: "", phone: "" });
  const [sent, setSent] = useState(false);
  const errors = {
    name: f.name.trim().length < 3 ? "Informe o nome do abrigo ou doador" : "",
    email: !/^\S+@\S+\.\S{2,}$/.test(f.email) ? "E-mail inválido" : "",
    phone: f.phone.replace(/\D/g, "").length !== 11 ? "Telefone inválido" : "",
  };
  return (
    <PhoneFrame>
      <div className="no-scrollbar animate-screen flex-1 overflow-y-auto">
        <header className="flex items-center gap-3 bg-teal px-4 py-5 text-teal-foreground">
          <Link to="/login" aria-label="Voltar" className="rounded-full p-1 hover:bg-teal-foreground/10"><ArrowLeft className="size-5" /></Link>
          <h1 className="text-lg font-bold">Cadastro de abrigo / doador</h1>
        </header>
        <form noValidate onSubmit={(e) => { e.preventDefault(); setSent(true); if (Object.values(errors).some(Boolean)) return; toast.success("Solicitação enviada!", { description: "Entraremos em contato em até 48h." }); navigate({ to: "/login" }); }} className="m-4 space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Quer doar um pet ou cadastrar seu abrigo? Deixe seus dados que nossa equipe entra em contato.</p>
          <Field label="Nome do abrigo ou doador" name="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={sent ? errors.name : undefined} />
          <Field label="CNPJ / CPF (opcional)" name="cnpj" value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} />
          <Field label="Email" name="email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={sent ? errors.email : undefined} />
          <Field label="Telefone" name="phone" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })} error={sent ? errors.phone : undefined} />
          <Button type="submit" size="lg" className="w-full">Enviar cadastro</Button>
        </form>
      </div>
    </PhoneFrame>
  );
}
