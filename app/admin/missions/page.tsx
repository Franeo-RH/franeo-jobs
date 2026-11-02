import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnTete, Pastille } from "@/components/Coquille";
import BoutonExport from "@/components/BoutonExport";
import { STATUTS_MISSION, fourchette, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Missions({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const missions = await prisma.mission.findMany({
    where: { entreprise: { demo: false }, ...(sp.statut ? { statut: sp.statut } : {}) },
    orderBy: { createdAt: "desc" },
    include: { entreprise: true, _count: { select: { candidatures: true, presentations: true } } },
  });
  return (
    <>
      <EnTete titre="Missions" sous={`${missions.length} mission${missions.length > 1 ? "s" : ""}`}>
        <BoutonExport type="missions" />
        <Link href="/admin/missions/nouveau" className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">➕ Nouvelle mission</Link>
      </EnTete>
      <div className="bg-white rounded-xl shadow p-6 mb-6 flex gap-2 flex-wrap">
        <Link href="/admin/missions" className={`px-3 py-1 rounded-full text-sm font-semibold ${!sp.statut ? "bg-violet-600 text-white" : "bg-gray-100"}`}>Toutes</Link>
        {Object.entries(STATUTS_MISSION).map(([k, v]) => (
          <Link key={k} href={`/admin/missions?statut=${k}`} className={`px-3 py-1 rounded-full text-sm font-semibold ${sp.statut === k ? "bg-violet-600 text-white" : "bg-gray-100"}`}>{v.label}</Link>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Réf.</th><th>Poste</th><th>Client</th><th>Lieu</th><th>Salaire</th><th>Candidatures</th><th>Présentés</th><th>Statut</th><th>Créée le</th></tr></thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td data-label="Réf." className="py-3"><Link href={`/admin/missions/${m.id}`} className="font-semibold text-violet-700 hover:underline">{m.reference}</Link></td>
                <td data-label="Poste">{m.poste}</td><td data-label="Client">{m.entreprise.nom}</td><td data-label="Lieu">{m.lieu}</td>
                <td data-label="Salaire">{fourchette(m.salaireMin, m.salaireMax)}</td>
                <td data-label="Candidatures">{m._count.candidatures}</td><td data-label="Présentés">{m._count.presentations}</td>
                <td data-label="Statut"><Pastille def={STATUTS_MISSION[m.statut]} /></td><td data-label="Créée le">{formatDate(m.createdAt)}</td>
              </tr>
            ))}
            {missions.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-gray-500">Aucune mission.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
