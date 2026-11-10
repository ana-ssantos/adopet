import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { PhoneFrame } from "@/components/adopet/AppShell";
import { Field } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { useApp, validatePassword } from "@/store/app-store";
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

type F = { name: string; cnpj: string; email: string; phone: string; password: string; confirm: string };

function CadastroAbrigo() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [f, setF] = useState<F>({ name: "", cnpj: "", email: "", phone: "", password: "", confirm: "" });
  const [sent, setSent] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const errors: Partial<Record<keyof F, string>> = {
    ...(f.name.trim().length < 3 && { name: "Informe o nome do abrigo ou doador" }),
    ...(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) && { email: "E-mail inválido" }),
    ...(f.phone.replace(/\D/g, "").length !== 11 && { phone: "Telefone deve ter o formato (XX) XXXXX-XXXX" }),
    ...validatePassword(f.password, f.confirm),
  };
  const err = (k: keyof F) => (sent ? errors[k] : undefined);
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: k === "phone" ? maskPhone(e.target.value) : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    if (Object.keys(errors).length) return;
    setLoading(true);
    const r = await register({ role: "abrigo", name: f.name.trim(), email: f.email, phone: f.phone, document: f.cnpj.trim() || undefined, password: f.password });
    setLoading(false);
    if (r.error) return void toast.error(r.error);
    toast.success("Cadastro realizado!", { description: r.needsConfirmation ? "Confirme pelo link enviado ao seu e-mail e faça login." : "Agora é só fazer login." });
    navigate({ to: "/login" });
  };

  const eye = (
    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="p-2 text-muted-foreground">
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );

  return (
    <PhoneFrame>
      <div className="no-scrollbar animate-screen flex-1 overflow-y-auto">
        <header className="flex items-center gap-3 bg-teal px-4 py-5 text-teal-foreground">
          <Link to="/login" aria-label="Voltar" className="rounded-full p-1 hover:bg-teal-foreground/10"><ArrowLeft className="size-5" /></Link>
          <h1 className="text-lg font-bold">Cadastro de abrigo / doador</h1>
        </header>
        <form noValidate onSubmit={submit} className="m-4 space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Crie a conta do seu abrigo para divulgar pets e conversar com tutores.</p>
          <Field label="Nome do abrigo ou doador" name="name" value={f.name} onChange={set("name")} error={err("name")} />
          <Field label="CNPJ / CPF (opcional)" name="cnpj" value={f.cnpj} onChange={set("cnpj")} />
          <Field label="Email" name="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} error={err("email")} />
          <Field label="Telefone" name="phone" inputMode="tel" placeholder="(21) 99999-9999" value={f.phone} onChange={set("phone")} error={err("phone")} />
          <Field label="Senha" name="password" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Mínimo de 8 caracteres" value={f.password} onChange={set("password")} error={err("password")} right={eye} />
          <Field label="Confirmar senha" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={err("confirm")} />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Registrando..." : "Criar conta"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta? <Link to="/login" className="font-semibold text-teal underline-offset-2 hover:underline">Fazer login</Link>
          </p>
        </form>
      </div>
    </PhoneFrame>
  );
}
