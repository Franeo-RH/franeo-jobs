import { prisma } from "@/lib/prisma";
import { exigerCandidat } from "@/lib/session";
import { Carte, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { majMesAlertes, majMonProfil, remplacerMonCv, supprimerMonEspace } from "@/lib/actions/candidat";
import { CATEGORIES, DISPONIBILITES, NIVEAUX, TELETRAVAIL, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function MesInformations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await exigerCandidat();
  const sp = await searchParams;
  const c = await prisma.candidat.findUnique({ where: { id: s.candidatId }, select: { prenom: true, nom: true, email: true, telephone: true, ville: true, linkedin: true, poste: true, competences: true, experience: true, niveau: true, disponibilite: true, preavis: true, mobilite: true, teletravail: true, salaireSouhaite: true, cvNom: true, updatedAt: true, id: true, alertesMetiers: true } });
  if (!c) return null;
  const L = "block text-sm font-semibold mb-1";
  const opt = (l: string[]) => <><option value="">—</option>{l.map((x) => <option key={x}>{x}</option>)}</>;
  return (
    <>
      <div className="bg-white rounded-xl shadow p-8 mb-6">
        <h1 className="text-3xl font-bold">Mes informations</h1>
        <p className="text-gray-500 mt-1">Gardez votre profil à jour : votre consultant voit vos changements immédiatement. E-mail : {c.email}</p>
      </div>
      <Alerte erreur={sp.erreur} ok={sp.ok} />

      <Carte titre="Mon profil">
        <form action={majMonProfil} className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div><label className={L}>Prénom *</label><input name="prenom" defaultValue={c.prenom} className={champ} required /></div>
          <div><label className={L}>Nom *</label><input name="nom" defaultValue={c.nom} className={champ} required /></div>
          <div><label className={L}>Téléphone</label><input name="telephone" defaultValue={c.telephone ?? ""} className={champ} /></div>
          <div><label className={L}>Ville</label><input name="ville" defaultValue={c.ville ?? ""} className={champ} /></div>
          <div><label className={L}>LinkedIn</label><input name="linkedin" defaultValue={c.linkedin ?? ""} className={champ} /></div>
          <div><label className={L}>Poste recherché</label><input name="poste" defaultValue={c.poste ?? ""} className={champ} /></div>
          <div><label className={L}>Expérience</label><input name="experience" defaultValue={c.experience ?? ""} className={champ} /></div>
          <div><label className={L}>Niveau d&apos;études</label><select name="niveau" defaultValue={c.niveau ?? ""} className={champ}>{opt(NIVEAUX)}</select></div>
          <div><label className={L}>Disponibilité</label><select name="disponibilite" defaultValue={c.disponibilite ?? ""} className={champ}>{opt(DISPONIBILITES)}</select></div>
          <div><label className={L}>Préavis</label><input name="preavis" defaultValue={c.preavis ?? ""} className={champ} /></div>
          <div><label className={L}>Mobilité</label><input name="mobilite" defaultValue={c.mobilite ?? ""} className={champ} /></div>
          <div><label className={L}>Télétravail</label><select name="teletravail" defaultValue={c.teletravail ?? ""} className={champ}>{opt(TELETRAVAIL)}</select></div>
          <div><label className={L}>Salaire souhaité (€ brut/an)</label><input name="salaireSouhaite" defaultValue={c.salaireSouhaite ?? ""} inputMode="numeric" className={champ} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label className={L}>Compétences (séparées par des virgules)</label><input name="competences" defaultValue={c.competences.join(", ")} className={champ} /></div>
          <div><BoutonAction>Enregistrer</BoutonAction></div>
        </form>
      </Carte>

      <Carte titre="Mon CV">
        <p className="mb-4">{c.cvNom ? <>CV actuel : <a href={`/api/candidats/${c.id}/cv`} className="text-violet-700 underline">{c.cvNom}</a></> : "Aucun CV pour l'instant."}</p>
        <form action={remplacerMonCv} className="flex gap-3 flex-wrap items-center">
          <input type="file" name="cv" accept=".pdf,.doc,.docx" className="border-2 border-dashed rounded-lg px-4 py-3 bg-gray-50" required />
          <BoutonAction>{c.cvNom ? "Remplacer mon CV" : "Ajouter mon CV"}</BoutonAction>
        </form>
        <p className="text-xs text-gray-500 mt-2">PDF ou Word, 5 Mo maximum.</p>
      </Carte>

      <Carte titre="🔔 Mes alertes emploi">
        <p className="text-sm text-gray-600 mb-3">Recevez un e-mail dès qu&apos;une offre est publiée dans les métiers cochés.</p>
        <form action={majMesAlertes}>
          <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {CATEGORIES.map((m) => (
              <label key={m} className="flex items-center gap-2"><input type="checkbox" name="metiers" value={m} defaultChecked={c.alertesMetiers.includes(m)} className="accent-violet-600" /> {m}</label>
            ))}
          </div>
          <BoutonAction>Enregistrer mes alertes</BoutonAction>
        </form>
      </Carte>

      <Carte titre="Mes données">
        <p className="text-sm text-gray-600 mb-3">Dernière mise à jour : {formatDate(c.updatedAt)}. Vous pouvez supprimer votre espace à tout moment : vos données personnelles et votre CV seront effacés.</p>
        <form action={supprimerMonEspace}><BoutonAction confirmation="Supprimer définitivement votre espace et vos données ?" className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700">Supprimer mon espace</BoutonAction></form>
      </Carte>
    </>
  );
}
