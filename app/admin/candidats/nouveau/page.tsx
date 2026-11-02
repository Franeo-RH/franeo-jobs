import { EnTete, Carte, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { creerCandidat } from "@/lib/actions/candidats";
import { CATEGORIES, DISPONIBILITES, NIVEAUX, SOURCES, TELETRAVAIL } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function NouveauCandidat({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const L = "block text-sm font-semibold mb-1";
  const opt = (l: string[]) => <><option value="">Choisir…</option>{l.map((x) => <option key={x}>{x}</option>)}</>;
  return (
    <>
      <EnTete titre="Ajouter un candidat" sous="Profil reçu par un autre canal (cooptation, LinkedIn, appel…). Le CV peut être ajouté par le candidat en postulant." />
      <Alerte erreur={sp.erreur} />
      <Carte>
        <form action={creerCandidat} className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div><label className={L}>Prénom *</label><input name="prenom" className={champ} required /></div>
          <div><label className={L}>Nom *</label><input name="nom" className={champ} required /></div>
          <div><label className={L}>E-mail</label><input name="email" type="email" className={champ} /></div>
          <div><label className={L}>Téléphone</label><input name="telephone" className={champ} /></div>
          <div><label className={L}>Ville</label><input name="ville" className={champ} /></div>
          <div><label className={L}>LinkedIn</label><input name="linkedin" className={champ} /></div>
          <div><label className={L}>Métier</label><select name="metier" className={champ}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className={L}>Poste recherché</label><input name="poste" className={champ} /></div>
          <div><label className={L}>Expérience</label><input name="experience" className={champ} /></div>
          <div><label className={L}>Niveau d&apos;études</label><select name="niveau" className={champ}>{opt(NIVEAUX)}</select></div>
          <div><label className={L}>Disponibilité</label><select name="disponibilite" className={champ}>{opt(DISPONIBILITES)}</select></div>
          <div><label className={L}>Télétravail</label><select name="teletravail" className={champ}>{opt(TELETRAVAIL)}</select></div>
          <div><label className={L}>Mobilité</label><input name="mobilite" className={champ} /></div>
          <div><label className={L}>Salaire souhaité (€ brut/an)</label><input name="salaireSouhaite" inputMode="numeric" className={champ} /></div>
          <div><label className={L}>Source</label><select name="source" className={champ} defaultValue="Import manuel">{SOURCES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div style={{ gridColumn: "1 / -1" }}><label className={L}>Compétences (séparées par des virgules)</label><input name="competences" className={champ} /></div>
          <label className="flex items-center gap-2" style={{ gridColumn: "1 / -1" }}><input type="checkbox" name="consentement" value="oui" className="accent-violet-600" /> Le candidat a donné son accord pour conserver son profil (RGPD)</label>
          <div><BoutonAction>Créer le candidat</BoutonAction></div>
        </form>
      </Carte>
    </>
  );
}
