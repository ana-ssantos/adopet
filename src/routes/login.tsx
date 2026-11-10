import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { PhoneFrame } from "@/components/adopet/AppShell";
import { Logo } from "@/components/adopet/Logo";
import { Field } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { homeFor, useApp } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Entrar — ADOPET" },
    { name: "description", content: "Entre na sua conta ADOPET de tutor ou abrigo." },
    { property: "og:title", content: "Entrar — ADOPET" },
    { property: "og:description", content: "Entre na sua conta ADOPET de tutor ou abrigo." },
  ] }),
  component: Login,
});

function Login() {
  const { login, user, ready } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => { if (ready && user) navigate({ to: homeFor(user.role) }); }, [ready, user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Preencha e-mail e senha");
    setLoading(true);
    login(email, password).then((r) => {
      setLoading(false);
      if (r.error || !r.role) return setError(r.error ?? "E-mail ou senha inválidos");
      navigate({ to: homeFor(r.role), replace: true });
    });
  };

  return (
    <PhoneFrame>
      <div className="no-scrollbar animate-screen flex-1 overflow-y-auto">
        <div className="flex justify-center bg-teal pb-14 pt-12"><Logo size="lg" /></div>
        <form onSubmit={submit} noValidate className="-mt-8 mx-4 space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <h1 className="text-center text-xl font-bold underline decoration-brand-orange decoration-2 underline-offset-8">Entrar</h1>
          <p className="-mt-2 text-center text-xs text-muted-foreground">Para tutores e abrigos/doadores</p>
          <Field label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Senha" name="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            right={<button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="p-2 text-muted-foreground">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>} />
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          <button type="button" onClick={() => setForgot(true)} className="block w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline">Esqueceu a senha?</button>
        </form>
        <div className="space-y-2 px-6 py-8 text-center text-sm">
          <p>Quer adotar? <Link to="/cadastro" className="font-semibold text-teal hover:underline">Cadastre-se</Link></p>
          <p>Quer fazer doação? <Link to="/cadastro-abrigo" className="font-semibold text-teal hover:underline">Cadastre-se</Link></p>
        </div>
      </div>
      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>Enviaremos um link de recuperação para o seu e-mail.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); if (!/\S+@\S+\.\S+/.test(resetEmail)) { toast.error("Informe um e-mail válido"); return; } const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: `${window.location.origin}/reset-password` }); if (error) { toast.error("Não foi possível enviar o link"); return; } setForgot(false); toast.success("Link enviado!", { description: `Confira a caixa de entrada de ${resetEmail}` }); }} className="space-y-3">
            <Field label="Email" name="reset" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            <Button type="submit" className="w-full">Enviar link</Button>
          </form>
        </DialogContent>
      </Dialog>
    </PhoneFrame>
  );
}
