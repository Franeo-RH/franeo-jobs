import { prisma } from "@/lib/prisma";
import { Carte, EnTete, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { presenterCandidat } from "@/lib/actions/candidats";
import { MISSIONS_OUVERTES, formatDate } from "@/lib/constantes";
import { presentationAnterieure } from "@/lib/registre";

export const dynamic = "force-dynamic";

export default async function NouvellePresentation({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [candidats, missions] = await Promise.all([
    prisma.candidat.findMany({ where: { demo: false, NOT: { nom: "RGPD" } }, orderBy: [{ nom: "asc" }], select: { id: true, prenom: true, nom: true, metier: true } }),
    prisma.mission.findMany({ where: { entreprise: { demo: false }, statut: { in: MISSIONS_OUVERTES } }, orderBy: { createdAt: "desc" }, include: { entreprise: true } }),
  ]);
  const mission = missions.find((m) => m.id === sp.missionId);
  const anterieure = sp.candidatId && mission ? await presentationAnterieure(sp.candidatId, mission.entrepriseId) : null;
  const L = "block text-sm font-semibold mb-1";
  return (
    <>
      <EnTete titre="Présenter un candidat" sous="Le dossier est envoyé au client et inscrit au registre anti-litiges" />
      <Alerte erreur={sp.erreur} />
      {!sp.doublon && (
        <Carte titre="1. Choisir le candidat et la mission">
          <form method="get" className="flex gap-3 items-end flex-wrap">
            <div><label className={L}>Candidat</label><select name="candidatId" defaultValue={sp.candidatId ?? ""} className={champ} required><option value="">Choisir…</option>{candidats.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.metier})</option>)}</select></div>
            <div><label className={L}>Mission</label><select name="missionId" defaultValue={sp.missionId ?? ""} className={champ} required><option value="">Choisir…</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.reference} · {m.poste} ({m.entreprise.nom})</option>)}</select></div>
            <button className="bg-violet-600 text-white px-5 py-3 rounded-lg font-semibold">Vérifier</button>
          </form>
        </Carte>
      )}

      {sp.candidatId && mission && (
        <Carte titre="2. Contrôle anti-doublon et envoi">
          {anterieure ? (
            <p className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 mb-5">
              ⚠️ Ce candidat a <b>déjà été présenté à {mission.entreprise.nom}</b> le {formatDate(anterieure.envoyeAt)} (mission {anterieure.mission.reference} — {anterieure.mission.poste}). Pour le présenter de nouveau, indiquez un motif : il sera inscrit au registre.
            </p>
          ) : (
            <p className="bg-green-50 border border-green-300 text-green-800 rounded-lg px-4 py-3 mb-5">✅ Aucune présentation antérieure à {mission.entreprise.nom}.</p>
          )}
          <form action={presenterCandidat} className="grid gap-4">
            <input type="hidden" name="candidatId" value={sp.candidatId} />
            <input type="hidden" name="missionId" value={mission.id} />
            {anterieure && (
              <>
                <input type="hidden" name="forcer" value="oui" />
                <div><label className={L}>Motif de la nouvelle présentation *</label><input name="motifDoublon" className={champ} placeholder="Ex. nouvelle mission, profil mis à jour…" required /></div>
              </>
            )}
            <div><label className={L}>Destinataires (e-mails séparés par des virgules)</label><input name="destinataires" className={champ} placeholder="Par défaut : tous les accès actifs du client" /></div>
            <div><label className={L}>Votre avis de consultant</label><textarea name="avis" rows={3} className={champ} /></div>
            <div><label className={L}>Synthèse d&apos;entretien</label><textarea name="synthese" rows={4} className={champ} /></div>
            <div><BoutonAction confirmation={`Envoyer ce dossier à ${mission.entreprise.nom} ?`}>{anterieure ? "Confirmer et envoyer malgré le doublon" : "Envoyer le dossier au client"}</BoutonAction></div>
          </form>
        </Carte>
      )}
    </>
  );
}
