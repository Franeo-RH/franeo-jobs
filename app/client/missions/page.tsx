import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/session";
import { EnTete, Pastille } from "@/components/Coquille";
import { STATUTS_MISSION, fourchette, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function MissionsClient() {
  const s = await exigerClient();
  const missions = await prisma.mission.findMany({ where: { entrepriseId: s.entrepriseId }, orderBy: { createdAt: "desc" }, include: { _count: { select: { presentations: true } } } });
  return (
    <>
      <EnTete titre="Mes missions" sous={`${missions.length} mission${missions.length > 1 ? "s" : ""} confiée${missions.length > 1 ? "s" : ""} à FRANEO RH`} />
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Réf.</th><th>Poste</th><th>Lieu</th><th>Salaire</th><th>Candidats présentés</th><th>Statut</th><th>Ouverte le</th></tr></thead>
          <tbody>
            {missions.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td data-label="Réf." className="py-3"><Link href={`/client/missions/${m.id}`} className="font-semibold text-violet-700 hover:underline">{m.reference}</Link></td>
                <td data-label="Poste">{m.poste}</td><td data-label="Lieu">{m.lieu}</td><td data-label="Salaire">{fourchette(m.salaireMin, m.salaireMax)}</td>
                <td data-label="Candidats présentés">{m._count.presentations}</td><td data-label="Statut"><Pastille def={STATUTS_MISSION[m.statut]} /></td><td data-label="Ouverte le">{formatDate(m.createdAt)}</td>
              </tr>
            ))}
            {missions.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">Aucune mission pour le moment.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
