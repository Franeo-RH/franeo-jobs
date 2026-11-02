import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/session";
import { Carte, Chiffre, EnTete, Pastille } from "@/components/Coquille";
import { MISSIONS_OUVERTES, STATUTS_PRESENTATION, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function DashboardClient() {
  const s = await exigerClient();
  const where = { entrepriseId: s.entrepriseId };
  const [missions, total, attente, retenus, derniers] = await Promise.all([
    prisma.mission.count({ where: { ...where, statut: { in: MISSIONS_OUVERTES } } }),
    prisma.presentation.count({ where }),
    prisma.presentation.count({ where: { ...where, statut: "EN_ATTENTE" } }),
    prisma.presentation.count({ where: { ...where, statut: "RETENU" } }),
    prisma.presentation.findMany({ where, orderBy: { envoyeAt: "desc" }, take: 6, include: { candidat: true, mission: true } }),
  ]);
  return (
    <>
      <EnTete titre={`Bonjour ${s.prenom}`} sous={`Espace recrutement de ${s.entreprise?.nom}`} />
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Chiffre label="Missions en cours" valeur={missions} href="/client/missions" />
        <Chiffre label="Candidats reçus" valeur={total} href="/client/candidats" />
        <Chiffre label="Réponse attendue" valeur={attente} note={attente ? "à traiter" : undefined} href="/client/candidats" />
        <Chiffre label="Candidats retenus" valeur={retenus} />
      </div>
      <Carte titre="Derniers candidats présentés">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Candidat</th><th>Mission</th><th>Reçu le</th><th>Statut</th></tr></thead>
          <tbody>
            {derniers.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td data-label="Candidat" className="py-3"><Link href={`/client/candidats/${p.id}`} className="font-semibold text-violet-700 hover:underline">{p.candidat.prenom} {p.candidat.nom}</Link><p className="text-xs text-gray-500">{p.candidat.poste || p.candidat.metier}</p></td>
                <td data-label="Mission">{p.mission.poste}</td><td data-label="Reçu le">{formatDate(p.envoyeAt)}</td>
                <td data-label="Statut"><Pastille def={STATUTS_PRESENTATION[p.statut]} /></td>
              </tr>
            ))}
            {derniers.length === 0 && <tr><td colSpan={4} className="py-6 text-gray-500">Aucun candidat pour le moment. Votre consultant FRANEO RH vous présentera les meilleurs profils ici.</td></tr>}
          </tbody>
        </table>
      </Carte>
    </>
  );
}
