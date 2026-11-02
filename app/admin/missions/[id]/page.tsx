import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Carte, EnTete, Pastille, champ } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import { majMission } from "@/lib/actions/gestion";
import { STATUTS_MISSION, STATUTS_OFFRE, STATUTS_PRESENTATION, fourchette, formatDate, libelleEtape } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function FicheMission({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.mission.findUnique({
    where: { id },
    include: {
      entreprise: true, offres: true,
      candidatures: { include: { candidat: true }, orderBy: { updatedAt: "desc" } },
      presentations: { include: { candidat: true }, orderBy: { envoyeAt: "desc" } },
    },
  });
  if (!m) notFound();
  return (
    <>
      <EnTete titre={`${m.reference} · ${m.poste}`} sous={<>{m.entreprise.nom} · {m.lieu} · {m.contrat} · {fourchette(m.salaireMin, m.salaireMax)}</>}>
        <Link href={`/admin/matching?mission=${m.id}`} className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">🎯 Matching</Link>
        <Link href={`/admin/pipeline?mission=${m.id}`} className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200">🧭 Pipeline</Link>
        <Link href={`/admin/offres/nouveau?missionId=${m.id}`} className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200">💼 Créer l&apos;offre</Link>
      </EnTete>

      <Carte titre="Suivi">
        <form action={majMission} className="flex gap-3 flex-wrap items-end">
          <input type="hidden" name="id" value={m.id} />
          <div><label className="block text-sm font-semibold mb-1">Statut</label>
            <select name="statut" defaultValue={m.statut} className={champ}>{Object.entries(STATUTS_MISSION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><label className="block text-sm font-semibold mb-1">Consultant</label><input name="consultant" defaultValue={m.consultant ?? ""} className={champ} /></div>
          <BoutonAction>Enregistrer</BoutonAction>
        </form>
        {m.competences.length > 0 && <p className="mt-4 text-sm text-gray-600">Compétences : {m.competences.join(", ")}</p>}
        {m.description && <p className="mt-3 whitespace-pre-line">{m.description}</p>}
      </Carte>

      <Carte titre={`Offres liées (${m.offres.length})`}>
        {m.offres.length === 0 ? <p className="text-gray-500">Aucune offre publiée pour cette mission.</p> : (
          <ul className="divide-y">{m.offres.map((o) => (
            <li key={o.id} className="py-2 flex justify-between"><Link href={`/admin/offres/${o.id}`} className="text-violet-700 hover:underline">{o.titre}</Link><Pastille def={STATUTS_OFFRE[o.statut]} /></li>
          ))}</ul>
        )}
      </Carte>

      <Carte titre={`Candidatures (${m.candidatures.length})`}>
        <ul className="divide-y">
          {m.candidatures.map((c) => (
            <li key={c.id} className="py-2 flex justify-between gap-3"><Link href={`/admin/candidats/${c.candidatId}`} className="text-violet-700 hover:underline">{c.candidat.prenom} {c.candidat.nom}</Link><span className="text-sm text-gray-500">{libelleEtape(c.etape)}</span></li>
          ))}
          {m.candidatures.length === 0 && <li className="py-2 text-gray-500">Aucune candidature. Utilisez le matching pour proposer des profils du vivier.</li>}
        </ul>
      </Carte>

      <Carte titre={`Présentations (${m.presentations.length})`}>
        <ul className="divide-y">
          {m.presentations.map((p) => (
            <li key={p.id} className="py-2 flex justify-between gap-3"><span>{p.candidat.prenom} {p.candidat.nom} · {formatDate(p.envoyeAt)}</span><Pastille def={STATUTS_PRESENTATION[p.statut]} /></li>
          ))}
          {m.presentations.length === 0 && <li className="py-2 text-gray-500">Aucun candidat présenté.</li>}
        </ul>
      </Carte>
    </>
  );
}
