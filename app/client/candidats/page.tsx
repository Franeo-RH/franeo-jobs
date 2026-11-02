import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/session";
import { EnTete, Pastille, champ } from "@/components/Coquille";
import BoutonExport from "@/components/BoutonExport";
import { STATUTS_PRESENTATION, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function CandidatsClient({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await exigerClient();
  const sp = await searchParams;
  const liste = await prisma.presentation.findMany({
    where: { entrepriseId: s.entrepriseId, ...(sp.statut ? { statut: sp.statut } : {}), ...(sp.mission ? { missionId: sp.mission } : {}) },
    orderBy: { envoyeAt: "desc" }, include: { candidat: true, mission: true },
  });
  const missions = await prisma.mission.findMany({ where: { entrepriseId: s.entrepriseId }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <EnTete titre="Candidats présentés" sous={`${liste.length} dossier${liste.length > 1 ? "s" : ""}`}><BoutonExport type="candidats" label="📊 Exporter la liste" /></EnTete>
      <form className="bg-white rounded-xl shadow p-6 mb-6 flex gap-3 items-end flex-wrap">
        <select name="mission" defaultValue={sp.mission ?? ""} className={champ} style={{ maxWidth: 320 }} aria-label="Mission"><option value="">Toutes les missions</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.reference} · {m.poste}</option>)}</select>
        <select name="statut" defaultValue={sp.statut ?? ""} className={champ} style={{ maxWidth: 220 }} aria-label="Statut"><option value="">Tous les statuts</option>{Object.entries(STATUTS_PRESENTATION).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <button className="bg-violet-600 text-white px-5 py-3 rounded-lg font-semibold">Filtrer</button>
      </form>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Candidat</th><th>Mission</th><th>Ville</th><th>Reçu le</th><th>Statut</th></tr></thead>
          <tbody>
            {liste.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td data-label="Candidat" className="py-3"><Link href={`/client/candidats/${p.id}`} className="font-semibold text-violet-700 hover:underline">{p.candidat.prenom} {p.candidat.nom}</Link><p className="text-xs text-gray-500">{p.candidat.poste || p.candidat.metier}</p></td>
                <td data-label="Mission">{p.mission.poste}</td><td data-label="Ville">{p.candidat.ville || "—"}</td><td data-label="Reçu le">{formatDate(p.envoyeAt)}</td>
                <td data-label="Statut"><Pastille def={STATUTS_PRESENTATION[p.statut]} /></td>
              </tr>
            ))}
            {liste.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500">Aucun candidat.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
