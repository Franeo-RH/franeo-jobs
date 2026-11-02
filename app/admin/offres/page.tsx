import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnTete, Pastille } from "@/components/Coquille";
import BoutonExport from "@/components/BoutonExport";
import { STATUTS_OFFRE, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Offres({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const offres = await prisma.offre.findMany({
    where: sp.statut ? { statut: sp.statut } : {}, orderBy: { createdAt: "desc" },
    include: { _count: { select: { candidatures: true } }, mission: { select: { reference: true } } },
  });
  return (
    <>
      <EnTete titre="Offres d'emploi" sous={`${offres.length} offre${offres.length > 1 ? "s" : ""}`}>
        <BoutonExport type="offres" />
        <Link href="/admin/offres/nouveau" className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">➕ Créer une offre</Link>
      </EnTete>
      <div className="bg-white rounded-xl shadow p-6 mb-6 flex gap-2 flex-wrap">
        <Link href="/admin/offres" className={`px-3 py-1 rounded-full text-sm font-semibold ${!sp.statut ? "bg-violet-600 text-white" : "bg-gray-100"}`}>Toutes</Link>
        {Object.entries(STATUTS_OFFRE).map(([k, v]) => <Link key={k} href={`/admin/offres?statut=${k}`} className={`px-3 py-1 rounded-full text-sm font-semibold ${sp.statut === k ? "bg-violet-600 text-white" : "bg-gray-100"}`}>{v.label}</Link>)}
      </div>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Offre</th><th>Lieu</th><th>Mission</th><th>Diffusion</th><th>Candidatures</th><th>Statut</th><th>Créée le</th></tr></thead>
          <tbody>
            {offres.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td data-label="Offre" className="py-3"><Link href={`/admin/offres/${o.id}`} className="font-semibold text-violet-700 hover:underline">{o.titre}</Link></td>
                <td data-label="Lieu">{o.lieu}</td><td data-label="Mission">{o.mission?.reference ?? "—"}</td>
                <td data-label="Diffusion">{o.diffusion.join(", ") || "—"}</td><td data-label="Candidatures">{o._count.candidatures}</td>
                <td data-label="Statut"><Pastille def={STATUTS_OFFRE[o.statut]} /></td><td data-label="Créée le">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {offres.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">Aucune offre.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
