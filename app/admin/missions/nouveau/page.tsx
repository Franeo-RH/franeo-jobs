import { prisma } from "@/lib/prisma";
import { EnTete, Carte, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { creerMission } from "@/lib/actions/gestion";
import { CATEGORIES, CONTRATS, STATUTS_MISSION } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function NouvelleMission({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const clients = await prisma.entreprise.findMany({ where: { demo: false, actif: true }, orderBy: { nom: "asc" } });
  const L = "block text-sm font-semibold mb-1";
  return (
    <>
      <EnTete titre="Nouvelle mission" sous="Un besoin de recrutement exprimé par un client" />
      <Alerte erreur={sp.erreur} />
      <Carte>
        <form action={creerMission} className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div><label className={L}>Client *</label>
            <select name="entrepriseId" className={champ} defaultValue={sp.entrepriseId ?? ""} required><option value="">Choisir…</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
          <div><label className={L}>Poste *</label><input name="poste" className={champ} required /></div>
          <div><label className={L}>Lieu *</label><input name="lieu" className={champ} required /></div>
          <div><label className={L}>Métier</label><select name="categorie" className={champ}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className={L}>Contrat</label><select name="contrat" className={champ}>{CONTRATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className={L}>Nombre de postes</label><input name="nbPostes" defaultValue="1" inputMode="numeric" className={champ} /></div>
          <div><label className={L}>Salaire min (€ brut/an)</label><input name="salaireMin" inputMode="numeric" className={champ} /></div>
          <div><label className={L}>Salaire max (€ brut/an)</label><input name="salaireMax" inputMode="numeric" className={champ} /></div>
          <div><label className={L}>Consultant en charge</label><input name="consultant" className={champ} /></div>
          <div><label className={L}>Statut</label><select name="statut" className={champ} defaultValue="OUVERTE">{Object.entries(STATUTS_MISSION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div style={{ gridColumn: "1 / -1" }}><label className={L}>Compétences recherchées (séparées par des virgules)</label><input name="competences" className={champ} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label className={L}>Description du besoin</label><textarea name="description" rows={5} className={champ} /></div>
          <div><BoutonAction>Créer la mission</BoutonAction></div>
        </form>
      </Carte>
    </>
  );
}
