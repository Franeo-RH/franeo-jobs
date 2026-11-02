import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/session";
import { journaliser } from "@/lib/registre";
import { Carte, EnTete, Pastille, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { donnerRetour } from "@/lib/actions/client";
import { MOTIFS_REFUS, STATUTS_PRESENTATION, euros, formatDate, formatDateHeure } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function DossierCandidat({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await exigerClient();
  const { id } = await params;
  const sp = await searchParams;
  const p = await prisma.presentation.findFirst({
    where: { id, entrepriseId: s.entrepriseId },
    include: { candidat: { include: { entretiens: { orderBy: { date: "desc" }, take: 1 } } }, mission: true },
  });
  if (!p) notFound();

  // Première consultation : horodatée dans le registre anti-litiges
  if (!p.consulteAt) {
    await prisma.presentation.update({ where: { id: p.id }, data: { consulteAt: new Date() } });
    await journaliser({ type: "CONSULTATION", detail: `Dossier de ${p.candidat.prenom} ${p.candidat.nom} consulté`, acteur: `${s.prenom} ${s.nom}`.trim(), presentationId: p.id, candidatId: p.candidatId, entrepriseId: s.entrepriseId });
  }
  const c = p.candidat;
  const entretien = c.entretiens[0];
  const retenu = p.statut === "RETENU";
  const L = "block text-sm font-semibold mb-1";
  return (
    <>
      <EnTete titre={`${c.prenom} ${c.nom}`} sous={<><Pastille def={STATUTS_PRESENTATION[p.statut]} /> · {c.poste || c.metier} · mission {p.mission.reference} ({p.mission.poste})</>}>
        {c.cvNom && <a href={`/api/candidats/${c.id}/cv?presentation=${p.id}`} className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">📄 Télécharger le CV</a>}
      </EnTete>
      <Alerte erreur={sp.erreur} ok={sp.ok ? "Votre retour a bien été transmis à FRANEO RH ✅" : undefined} />

      {(p.avis || p.synthese) && (
        <Carte titre="L'avis de votre consultant">
          {p.avis && <p className="whitespace-pre-line">{p.avis}</p>}
          {p.synthese && <><h3 className="font-semibold mt-4 mb-1">Synthèse d&apos;entretien</h3><p className="whitespace-pre-line text-gray-700">{p.synthese}</p></>}
          {entretien && <p className="mt-3 text-sm text-gray-500">Grille d&apos;entretien FRANEO : <b className="text-violet-700">{entretien.score}/100</b></p>}
        </Carte>
      )}

      <Carte titre="Profil">
        <dl className="grid gap-2 text-sm" style={{ gridTemplateColumns: "auto 1fr" }}>
          <dt className="text-gray-500">Ville</dt><dd>{c.ville || "—"}</dd>
          <dt className="text-gray-500">Expérience</dt><dd>{c.experience || "—"}</dd>
          <dt className="text-gray-500">Études</dt><dd>{c.niveau || "—"}</dd>
          <dt className="text-gray-500">Disponibilité</dt><dd>{c.disponibilite || "—"}{c.preavis ? ` (préavis : ${c.preavis})` : ""}</dd>
          <dt className="text-gray-500">Mobilité</dt><dd>{c.mobilite || "—"} · télétravail : {c.teletravail || "—"}</dd>
          <dt className="text-gray-500">Salaire souhaité</dt><dd>{euros(c.salaireSouhaite)}</dd>
          {retenu && <><dt className="text-gray-500">E-mail</dt><dd>{c.email || "—"}</dd><dt className="text-gray-500">Téléphone</dt><dd>{c.telephone || "—"}</dd></>}
        </dl>
        {c.competences.length > 0 && <p className="mt-3 flex gap-2 flex-wrap">{c.competences.map((k) => <span key={k} className="fr-pastille bg-violet-100 text-violet-800">{k}</span>)}</p>}
        {!retenu && <p className="mt-4 text-xs text-gray-500">Les coordonnées du candidat sont communiquées dès que vous le retenez.</p>}
      </Carte>

      <Carte titre="Votre retour">
        {p.retourAt && <p className="text-sm text-gray-500 mb-4">Dernier retour le {formatDateHeure(p.retourAt)} : <Pastille def={STATUTS_PRESENTATION[p.statut]} />{p.motifRefus ? ` · ${p.motifRefus}` : ""}. Vous pouvez le modifier ci-dessous.</p>}
        <form action={donnerRetour} className="grid gap-4">
          <input type="hidden" name="id" value={p.id} />
          <fieldset className="flex gap-4 flex-wrap">
            <legend className={L}>Votre décision *</legend>
            {([["RETENU", "✅ Retenir"], ["A_REVOIR", "🔄 À revoir"], ["REFUSE", "❌ Refuser"]] as const).map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer"><input type="radio" name="statut" value={v} defaultChecked={p.statut === v} required className="accent-violet-600" /> {l}</label>
            ))}
          </fieldset>
          <div><label className={L}>Motif (obligatoire si refus)</label><select name="motifRefus" defaultValue={p.motifRefus ?? ""} className={champ}><option value="">—</option>{MOTIFS_REFUS.map((m) => <option key={m}>{m}</option>)}</select></div>
          <div><label className={L}>Commentaire pour FRANEO RH</label><textarea name="feedback" rows={3} defaultValue={p.feedback ?? ""} className={champ} /></div>
          <div><label className={L}>Ce qui manquerait pour convaincre (aide à mieux cibler)</label><textarea name="amelioration" rows={2} defaultValue={p.amelioration ?? ""} className={champ} /></div>
          <div><BoutonAction>Envoyer mon retour</BoutonAction></div>
        </form>
        <p className="text-xs text-gray-500 mt-3">Dossier reçu le {formatDate(p.envoyeAt)}. Chaque consultation et chaque réponse est horodatée.</p>
      </Carte>
    </>
  );
}
