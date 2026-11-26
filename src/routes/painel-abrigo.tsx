import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ClipboardList, PawPrint, Plus } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, RequireAuth, ShelterNav, TealHeader } from "@/components/adopet/AppShell";
import { Field } from "@/components/adopet/bits";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchDbPets } from "@/lib/db-pets";
import { formatAge, getPet, type Pet } from "@/data/pets";
import { useApp, type User } from "@/store/app-store";

export const Route = createFileRoute("/painel-abrigo")({
  head: () => ({ meta: [
    { title: "Painel do abrigo — ADOPET" },
    { name: "description", content: "Cadastre pets e responda às solicitações de adoção do seu abrigo." },
    { property: "og:title", content: "Painel do abrigo — ADOPET" },
    { property: "og:description", content: "Cadastre pets e responda às solicitações de adoção do seu abrigo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Painel,
});

interface Req { id: string; pet_id: string; name: string; phone: string; housing: string; has_other_pets: boolean; reason: string; status: string; created_at: string }
const statusLabel: Record<string, string> = { pendente: "Pendente", aprovada: "Aprovada", recusada: "Recusada", concluida: "Doação concluída", cancelada: "Doação cancelada" };
const petStatusLabel = { disponivel: "Disponível", em_processo: "Em processo de adoção", adotado: "Doação concluída" };
const housingLabel: Record<string, string> = { casa: "Casa", apartamento: "Apartamento", outro: "Outro" };

function Painel() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [reqs, setReqs] = useState<Req[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [closing, setClosing] = useState<{ pet: Pet; status: "concluida" | "cancelada" } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setMyPets(await fetchDbPets(user.id));
    const { data } = await supabase.from("adoption_requests").select("id, pet_id, name, phone, housing, has_other_pets, reason, status, created_at")
      .eq("shelter_id", user.id).order("created_at", { ascending: false });
    setReqs(data ?? []);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, status: "aprovada" | "recusada") => {
    setBusy(id);
    const { error } = await supabase.from("adoption_requests").update({ status }).eq("id", id);
    setBusy(null);
    if (error) { toast.error("Não foi possível atualizar. Tente novamente."); return; }
    toast.success(status === "aprovada" ? "Solicitação aprovada — pet em processo de adoção" : "Solicitação recusada");
    load();
  };

  /** Conclui (pet sai da tela inicial dos tutores) ou cancela (pet volta a ficar disponível) a doação. */
  const closeDonation = async () => {
    if (!closing) return;
    const { pet, status } = closing;
    setBusy(pet.id);
    const req = reqs?.find((r) => r.pet_id === pet.id && r.status === "aprovada");
    const { error } = req
      ? await supabase.from("adoption_requests").update({ status }).eq("id", req.id)
      : await supabase.from("pets").update({ status: status === "concluida" ? "adotado" : "disponivel" }).eq("id", pet.id);
    setBusy(null);
    setClosing(null);
    if (error) { toast.error("Não foi possível atualizar. Tente novamente."); return; }
    toast.success(status === "concluida" ? `Doação concluída: ${pet.name} saiu da tela inicial` : `Doação cancelada: ${pet.name} voltou a ficar disponível`);
    load();
  };

  return (
    <PhoneFrame>
      <RequireAuth role="abrigo">
        <main className="no-scrollbar animate-screen flex-1 overflow-y-auto">
          <TealHeader>
            <p className="text-sm opacity-80">Painel do abrigo</p>
            <h1 className="text-xl font-bold">{user?.name}</h1>
          </TealHeader>
          <div className="m-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card p-4 shadow-card"><PawPrint className="size-5 text-teal" /><p className="mt-2 text-2xl font-bold">{myPets.length}</p><p className="text-xs text-muted-foreground">Pets cadastrados</p></div>
            <div className="rounded-2xl bg-card p-4 shadow-card"><ClipboardList className="size-5 text-teal" /><p className="mt-2 text-2xl font-bold">{reqs?.filter((r) => r.status === "pendente").length ?? 0}</p><p className="text-xs text-muted-foreground">Pedidos pendentes</p></div>
          </div>

          <section className="m-4 space-y-3">
            <h2 className="font-semibold">Solicitações recebidas</h2>
            {reqs === null && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {reqs?.length === 0 && <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">Nenhuma solicitação ainda.</p>}
            {reqs?.map((r) => {
              const pet = getPet(r.pet_id);
              return (
                <article key={r.id} className="space-y-2 rounded-2xl bg-card p-4 text-sm shadow-card">
                  <div className="flex items-center gap-3">
                    {pet && <img src={pet.photos[0]} alt={pet.name} className="size-12 rounded-xl object-cover" />}
                    <div className="min-w-0 flex-1"><p className="font-semibold">{pet?.name ?? "Pet"}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p></div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{statusLabel[r.status] ?? r.status}</span>
                  </div>
                  <p><b>{r.name}</b> · {r.phone}</p>
                  <p className="text-muted-foreground">{housingLabel[r.housing] ?? r.housing} · {r.has_other_pets ? "Tem outros animais" : "Sem outros animais"}</p>
                  <p className="italic">"{r.reason}"</p>
                  {r.status === "pendente" && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1" disabled={busy === r.id} onClick={() => decide(r.id, "aprovada")}>Aprovar</Button>
                      <Button size="sm" variant="outline" className="flex-1" disabled={busy === r.id} onClick={() => decide(r.id, "recusada")}>Recusar</Button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <section className="m-4 space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Meus pets</h2><Button size="sm" onClick={() => setAdding(true)}><Plus className="size-4" />Cadastrar pet</Button></div>
            {myPets.length === 0 && <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">Cadastre seu primeiro pet para receber pedidos de adoção.</p>}
            {myPets.map((p) => (
              <div key={p.id} className="space-y-3 rounded-2xl bg-card p-3 shadow-card">
                <div className="flex items-center gap-3">
                  <img src={p.photos[0]} alt={p.name} className="size-12 rounded-xl object-cover" />
                  <div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.breed || (p.species === "cao" ? "Cão" : "Gato")} · {formatAge(p.ageYears)}</p></div>
                  <span className="text-xs font-semibold text-teal">{petStatusLabel[p.status ?? "disponivel"]}</span>
                </div>
                {p.status === "em_processo" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" disabled={busy === p.id} onClick={() => setClosing({ pet: p, status: "concluida" })}>Concluir doação</Button>
                    <Button size="sm" variant="outline" className="flex-1" disabled={busy === p.id} onClick={() => setClosing({ pet: p, status: "cancelada" })}>Cancelar doação</Button>
                  </div>
                )}
              </div>
            ))}
          </section>

          <div className="space-y-1 m-4 rounded-2xl bg-card p-5 text-sm shadow-card">
            <p className="font-semibold">Dados da conta</p>
            <p>{user?.email}</p>
            <p>{user?.phone}</p>
            {user?.document && <p>CNPJ/CPF: {user.document}</p>}
          </div>
          <div className="px-4 pb-6">
            <Button size="lg" variant="outline" className="w-full" onClick={async () => { await logout(); navigate({ to: "/login", replace: true }); }}>Sair</Button>
          </div>
        </main>
        {user && <AddPetDialog open={adding} onOpenChange={setAdding} user={user} onSaved={load} />}
        <AlertDialog open={!!closing} onOpenChange={(o) => { if (!o) setClosing(null); }}>
          <AlertDialogContent className="max-w-[350px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{closing?.status === "concluida" ? "Concluir doação?" : "Cancelar doação?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {closing?.status === "concluida"
                  ? `${closing.pet.name} sairá da tela inicial dos tutores e os outros pedidos pendentes serão recusados.`
                  : `${closing?.pet.name} voltará a ficar disponível para novos pedidos de adoção.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={closeDonation}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ShelterNav />
      </RequireAuth>
    </PhoneFrame>
  );
}

const empty = { name: "", species: "cao", breed: "", age: "1", size: "medio", coat: "curto", sex: "macho", vaccinated: false, dewormed: false, neutered: false, personality: "" };

function AddPetDialog({ open, onOpenChange, user, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; user: User; onSaved: () => void }) {
  const [f, setF] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const opts = (key: "species" | "size" | "coat" | "sex", list: [string, string][]) => (
    <div className="flex flex-wrap gap-2">{list.map(([v, l]) => (
      <button type="button" key={v} onClick={() => setF({ ...f, [key]: v })} className={`rounded-full border px-3 py-1 text-sm ${f[key] === v ? "border-teal bg-teal-soft text-teal" : ""}`}>{l}</button>
    ))}</div>
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const age = Number(f.age.replace(",", "."));
    if (f.name.trim().length < 1) return setErr("Informe o nome do pet");
    if (!(age >= 0 && age <= 30)) return setErr("Idade inválida (0 a 30 anos)");
    if (file && file.size > 5 * 1024 * 1024) return setErr("A foto deve ter até 5 MB");
    setErr(undefined); setSaving(true);
    let photo_url: string | null = null;
    if (file) {
      const path = `${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop() || "jpg"}`;
      const { error } = await supabase.storage.from("pet-photos").upload(path, file, { contentType: file.type });
      if (error) { setSaving(false); return toast.error("Falha ao enviar a foto"); }
      photo_url = path;
    }
    const { error } = await supabase.from("pets").insert({
      shelter_user_id: user.id, shelter_name: user.name, shelter_city: user.city ?? "", shelter_phone: user.phone,
      name: f.name.trim(), species: f.species, breed: f.breed.trim(), age_years: age, size: f.size, coat: f.coat, sex: f.sex,
      vaccinated: f.vaccinated, dewormed: f.dewormed, neutered: f.neutered, personality: f.personality.trim(), photo_url,
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível cadastrar o pet");
    toast.success(`${f.name} cadastrado!`);
    setF(empty); setFile(null); onOpenChange(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-[350px] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>Cadastrar pet</DialogTitle><DialogDescription>Ele aparecerá para os tutores na tela inicial.</DialogDescription></DialogHeader>
        <form onSubmit={save} noValidate className="space-y-3 text-sm">
          <Field label="Nome" name="petname" value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <div className="space-y-1.5"><p className="font-medium">Espécie</p>{opts("species", [["cao", "Cão"], ["gato", "Gato"]])}</div>
          <Field label="Raça" name="breed" value={f.breed} maxLength={80} onChange={(e) => setF({ ...f, breed: e.target.value })} />
          <Field label="Idade (anos, ex: 0.5)" name="age" inputMode="decimal" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} />
          <div className="space-y-1.5"><p className="font-medium">Porte</p>{opts("size", [["pequeno", "Pequeno"], ["medio", "Médio"], ["grande", "Grande"]])}</div>
          <div className="space-y-1.5"><p className="font-medium">Pelagem</p>{opts("coat", [["curto", "Curto"], ["medio", "Médio"], ["longo", "Longo"]])}</div>
          <div className="space-y-1.5"><p className="font-medium">Sexo</p>{opts("sex", [["macho", "Macho"], ["femea", "Fêmea"]])}</div>
          <div className="flex flex-wrap gap-3">{(["vaccinated", "dewormed", "neutered"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />{{ vaccinated: "Vacinado", dewormed: "Vermifugado", neutered: "Castrado" }[k]}</label>
          ))}</div>
          <div className="space-y-1.5"><label htmlFor="personality" className="font-medium">Personalidade</label><Textarea id="personality" rows={3} maxLength={600} value={f.personality} onChange={(e) => setF({ ...f, personality: e.target.value })} /></div>
          <div className="space-y-1.5"><label htmlFor="photo" className="font-medium">Foto</label><input id="photo" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-xs" /></div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Salvando..." : "Cadastrar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
