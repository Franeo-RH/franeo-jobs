import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnTete, Pastille } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonExport from "@/components/BoutonExport";
import { STATUTS_PRESENTATION, formatDate, formatDateHeure } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Presentations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const liste = await prisma.presentation.findMany({
    where: { entreprise: { demo: false }, ...(sp.statut ? { statut: sp.statut } : {}) },
    orderBy: { envoyeAt: "desc" }, take: 200, include: { candidat: true, entreprise: true, mission: true },
  });
  return (
    <>
      <EnTete titre="Registre des présentations" sous="Qui a été présenté à quel client, quand, et ce que le client en a fait">
        <BoutonExport type="presentations" />
        <Link href="/admin/presentations/nouvelle" className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">➕ Présenter un candidat</Link>
      </EnTete>
      <Alerte ok={sp.ok ? "Dossier envoyé au client ✅" : undefined} />
      <div className="bg-white rounded-xl shadow p-6 mb-6 flex gap-2 flex-wrap">
        <Link href="/admin/presentations" className={`px-3 py-1 rounded-full text-sm font-semibold ${!sp.statut ? "bg-violet-600 text-white" : "bg-gray-100"}`}>Toutes</Link>
        {Object.entries(STATUTS_PRESENTATION).map(([k, v]) => <Link key={k} href={`/admin/presentations?statut=${k}`} className={`px-3 py-1 rounded-full text-sm font-semibold ${sp.statut === k ? "bg-violet-600 text-white" : "bg-gray-100"}`}>{v.label}</Link>)}
      </div>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Candidat</th><th>Client</th><th>Mission</th><th>Envoyé le</th><th>Ouvert</th><th>Consulté</th><th>CV téléchargé</th><th>Retour</th></tr></thead>
          <tbody>
            {liste.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td data-label="Candidat" className="py-3"><Link href={`/admin/candidats/${p.candidatId}`} className="font-semibold text-violet-700 hover:underline">{p.candidat.prenom} {p.candidat.nom}</Link></td>
                <td data-label="Client"><Link href={`/admin/clients/${p.entrepriseId}`} className="hover:underline">{p.entreprise.nom}</Link></td>
                <td data-label="Mission">{p.mission.reference}</td><td data-label="Envoyé le">{formatDate(p.envoyeAt)}</td>
                <td data-label="Ouvert">{p.ouvertAt ? formatDateHeure(p.ouvertAt) : "—"}</td><td data-label="Consulté">{p.consulteAt ? formatDateHeure(p.consulteAt) : "—"}</td>
                <td data-label="CV téléchargé">{p.cvTelechargeAt ? formatDateHeure(p.cvTelechargeAt) : "—"}</td>
                <td data-label="Retour"><Pastille def={STATUTS_PRESENTATION[p.statut]} />{p.motifRefus && <p className="text-xs text-gray-500">{p.motifRefus}</p>}</td>
              </tr>
            ))}
            {liste.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-500">Aucune présentation.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
