import { champ } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import { CANAUX_DIFFUSION, CATEGORIES, CONTRATS } from "@/lib/constantes";
import { QUESTIONNAIRES } from "@/lib/questionnaires";

type Valeurs = {
  id?: string; titre?: string; lieu?: string; categorie?: string; contrat?: string; salaire?: string | null; description?: string; taches?: string | null;
  profil?: string | null; competences?: string[]; avantages?: string | null; questionnaire?: string; diffusion?: string[]; missionId?: string | null; seuilTest?: number;
};

/** Formulaire d'offre partagé par « Créer une offre » et « Modifier l'offre » */
export default function FormulaireOffre({ action, v = {}, missions, creation }: {
  action: (fd: FormData) => Promise<void>; v?: Valeurs; creation?: boolean;
  missions?: { id: string; reference: string; poste: string; entreprise: { nom: string } }[];
}) {
  const L = "block text-sm font-semibold mb-1";
  return (
    <form action={action} className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div><label className={L}>Titre de l&apos;offre *</label><input name="titre" defaultValue={v.titre} className={champ} required /></div>
      <div><label className={L}>Lieu *</label><input name="lieu" defaultValue={v.lieu} className={champ} required /></div>
      <div><label className={L}>Métier</label><select name="categorie" defaultValue={v.categorie ?? "Autres"} className={champ}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className={L}>Contrat</label><select name="contrat" defaultValue={v.contrat ?? "CDI"} className={champ}>{CONTRATS.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className={L}>Rémunération affichée</label><input name="salaire" defaultValue={v.salaire ?? ""} placeholder="Ex. 38–45 k€ brut/an" className={champ} /></div>
      {creation && missions && (
        <div><label className={L}>Mission liée</label>
          <select name="missionId" defaultValue={v.missionId ?? ""} className={champ}><option value="">Aucune (offre FRANEO)</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.reference} · {m.poste} ({m.entreprise.nom})</option>)}</select></div>
      )}
      <div><label className={L}>Questionnaire de présélection</label>
        <select name="questionnaire" defaultValue={v.questionnaire ?? "auto"} className={champ}>
          <option value="auto">Automatique (selon le métier)</option>
          {Object.values(QUESTIONNAIRES).map((q) => <option key={q.cle} value={q.cle}>{q.nom}</option>)}
          <option value="aucun">Aucun questionnaire</option>
        </select></div>
      <div><label className={L}>Score minimal conseillé (0 = aucun)</label><input name="seuilTest" type="number" min={0} max={100} defaultValue={v.seuilTest ?? 0} className={champ} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label className={L}>Description *</label><textarea name="description" rows={4} defaultValue={v.description} className={champ} required /></div>
      <div style={{ gridColumn: "1 / -1" }}><label className={L}>Missions et tâches</label><textarea name="taches" rows={3} defaultValue={v.taches ?? ""} className={champ} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label className={L}>Profil recherché</label><textarea name="profil" rows={3} defaultValue={v.profil ?? ""} className={champ} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label className={L}>Compétences (séparées par des virgules)</label><input name="competences" defaultValue={(v.competences ?? []).join(", ")} className={champ} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label className={L}>Avantages</label><input name="avantages" defaultValue={v.avantages ?? ""} className={champ} /></div>
      <fieldset style={{ gridColumn: "1 / -1" }}>
        <legend className={L}>Diffusion (multi-sourcing)</legend>
        <div className="flex gap-5 flex-wrap">
          {CANAUX_DIFFUSION.map((c) => (
            <label key={c} className="flex items-center gap-2"><input type="checkbox" name="diffusion" value={c} defaultChecked={(v.diffusion ?? ["Site Franeo Jobs"]).includes(c)} className="accent-violet-600" /> {c}</label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">Le site Franeo Jobs est mis à jour automatiquement. LinkedIn, Indeed et APEC : copiez l&apos;offre depuis la page publique et suivez l&apos;état ici.</p>
      </fieldset>
      <div className="flex gap-3 flex-wrap">
        {creation ? (
          <>
            <button type="submit" name="action" value="brouillon" className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200">Enregistrer en brouillon</button>
            <button type="submit" name="action" value="publier" className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">Publier maintenant</button>
          </>
        ) : <BoutonAction>Enregistrer</BoutonAction>}
      </div>
    </form>
  );
}
