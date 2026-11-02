import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Carte, EnTete, Jauge, champ } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import { ajouterAuPipeline } from "@/lib/actions/candidats";
import { scoreMatching } from "@/lib/matching";
import { MISSIONS_OUVERTES, fourchette } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Matching({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const missions = await prisma.mission.findMany({ where: { entreprise: { demo: false }, statut: { in: MISSIONS_OUVERTES } }, orderBy: { createdAt: "desc" }, include: { entreprise: true } });
  const mission = sp.mission ? missions.find((m) => m.id === sp.mission) ?? (await prisma.mission.findUnique({ where: { id: sp.mission }, include: { entreprise: true } })) : null;
  const candidats = mission ? await prisma.candidat.findMany({ where: { demo: false, statut: { notIn: ["RECRUTE", "NON_RETENU"] } }, include: { candidatures: { where: { missionId: mission.id }, select: { id: true } } } }) : [];
  const classement = candidats.map((c) => ({ c, s: scoreMatching(c, mission!) })).sort((a, b) => b.s.total - a.s.total).slice(0, 15);
  const pct = (x: number) => `${Math.round(x * 100)} %`;
  return (
    <>
      <EnTete titre="Matching candidats / missions" sous="Métier 30 % · compétences 25 % · géographie 15 % · salaire 15 % · disponibilité 15 %" />
      <form className="bg-white rounded-xl shadow p-6 mb-6 flex gap-3 items-end flex-wrap">
        <div><label className="block text-sm font-semibold mb-1">Mission</label>
          <select name="mission" defaultValue={sp.mission ?? ""} className={champ}><option value="">Choisir une mission…</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.reference} · {m.poste} ({m.entreprise.nom})</option>)}</select></div>
        <button className="bg-violet-600 text-white px-5 py-3 rounded-lg font-semibold">Chercher les meilleurs profils</button>
      </form>
      {mission && (
        <Carte titre={`Meilleurs profils pour « ${mission.poste} » (${mission.lieu}, ${fourchette(mission.salaireMin, mission.salaireMax)})`}>
          <table className="w-full text-left">
            <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Candidat</th><th>Score</th><th>Métier</th><th>Compétences</th><th>Géo</th><th>Salaire</th><th>Dispo</th><th></th></tr></thead>
            <tbody>
              {classement.map(({ c, s }) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td data-label="Candidat" className="py-3"><Link href={`/admin/candidats/${c.id}`} className="font-semibold text-violet-700 hover:underline">{c.prenom} {c.nom}</Link><p className="text-xs text-gray-500">{c.poste || c.metier} · {c.ville || "—"}</p></td>
                  <td data-label="Score" style={{ minWidth: 120 }}><b>{s.total}/100</b><Jauge valeur={s.total} /></td>
                  <td data-label="Métier">{pct(s.metier)}</td><td data-label="Compétences">{pct(s.competences)}</td><td data-label="Géo">{pct(s.geo)}</td><td data-label="Salaire">{pct(s.salaire)}</td><td data-label="Dispo">{pct(s.dispo)}</td>
                  <td data-label="">
                    {c.candidatures.length > 0 ? <span className="text-sm text-green-700">Déjà au pipeline</span> : (
                      <form action={ajouterAuPipeline}><input type="hidden" name="candidatId" value={c.id} /><input type="hidden" name="missionId" value={mission.id} /><BoutonAction>+ Pipeline</BoutonAction></form>
                    )}
                  </td>
                </tr>
              ))}
              {classement.length === 0 && <tr><td colSpan={8} className="py-6 text-gray-500">Aucun candidat dans le vivier.</td></tr>}
            </tbody>
          </table>
        </Carte>
      )}
    </>
  );
}
