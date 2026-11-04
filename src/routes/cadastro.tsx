import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { PhoneFrame } from "@/components/adopet/AppShell";
import { Logo } from "@/components/adopet/Logo";
import { Field } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { cities } from "@/data/pets";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [
    { title: "Cadastro para tutor — ADOPET" },
    { name: "description", content: "Crie sua conta de tutor e encontre um pet para adotar no RJ." },
    { property: "og:title", content: "Cadastro para tutor — ADOPET" },
    { property: "og:description", content: "Crie sua conta de tutor e encontre um pet para adotar no RJ." },
  ] }),
  component: Cadastro,
});

/** Máscara (XX) XXXXX-XXXX */
export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

type F = { name: string; email: string; phone: string; city: string; age: string; password: string };
const validate = (f: F) => {
  const e: Partial<Record<keyof F, string>> = {};
  if (f.name.trim().length < 3) e.name = "Informe seu nome completo";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "E-mail inválido";
  if (f.phone.replace(/\D/g, "").length !== 11) e.phone = "Telefone deve ter o formato (XX) XXXXX-XXXX";
  const age = Number(f.age);
  if (!f.age) e.age = "Informe sua idade";
  else if (age < 18) e.age = "É preciso ter 18 anos ou mais para adotar";
  else if (age > 120) e.age = "Idade inválida";
  if (f.password.length < 6) e.password = "A senha precisa ter ao menos 6 caracteres";
  return e;
};

function Cadastro() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [f, setF] = useState<F>({ name: "", email: "", phone: "", city: cities[0] ?? "", age: "", password: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof F, boolean>>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const errors = validate(f);
  const err = (k: keyof F) => (touched[k] ? errors[k] : undefined);
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF({ ...f, [k]: k === "phone" ? maskPhone(e.target.value) : e.target.value });
    setTouched((t) => ({ ...t, [k]: true }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, age: true, password: true });
    if (Object.keys(errors).length) return;
    setLoading(true);
    setTimeout(() => {
      register({ name: f.name.trim(), email: f.email.trim().toLowerCase(), phone: f.phone, city: f.city, age: Number(f.age), password: f.password });
      toast.success("Cadastro realizado!", { description: "Agora é só fazer login." });
      navigate({ to: "/login" });
    }, 700);
  };

  return (
    <PhoneFrame>
      <div className="no-scrollbar animate-screen flex-1 overflow-y-auto">
        <div className="flex justify-center bg-teal py-8"><Logo size="lg" /></div>
        <form onSubmit={submit} noValidate className="-mt-4 mx-4 mb-8 space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <h1 className="text-center text-xl font-bold">Cadastro para tutor</h1>
          <Field label="Nome Completo" name="name" autoComplete="name" value={f.name} onChange={set("name")} error={err("name")} />
          <Field label="Email" name="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} error={err("email")} />
          <Field label="Telefone" name="phone" inputMode="tel" placeholder="(21) 99999-9999" value={f.phone} onChange={set("phone")} error={err("phone")} />
          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-medium">Localização</label>
            <select id="city" value={f.city} onChange={set("city")} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/25">
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Idade" name="age" type="number" min={18} inputMode="numeric" value={f.age} onChange={set("age")} error={err("age")} />
          <Field label="Senha" name="password" type={show ? "text" : "password"} autoComplete="new-password" value={f.password} onChange={set("password")} error={err("password")}
            right={<button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="p-2 text-muted-foreground">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>} />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Registrando..." : "Registrar"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta? <Link to="/login" className="font-semibold text-teal underline-offset-2 hover:underline">Fazer login</Link>
          </p>
        </form>
      </div>
    </PhoneFrame>
  );
}
