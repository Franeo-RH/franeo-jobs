import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Carte, EnTete, Jauge } from "@/components/Coquille";
import { CANAUX_DIFFUSION } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Sourcing() {
  const [offres, parSource, retenus] = await Promise.all([
    prisma.offre.findMany({ where: { statut: "PUBLIEE" }, orderBy: { publieeAt: "desc" }, include: { _count: { select: { candidatures: true } } } }),
    prisma.candidat.groupBy({ by: ["source"], where: { demo: false }, _count: { _all: true }, orderBy: { _count: { source: "desc" } } }),
    prisma.candidat.groupBy({ by: ["source"], where: { demo: false, statut: { in: ["QUALIFIE", "PRESENTABLE", "RECRUTE"] } }, _count: { _all: true } }),
  ]);
  const total = Math.max(1, ...parSource.map((s) => s._count._all));
  const qualifies = new Map(retenus.map((r) => [r.source, r._count._all]));
  return (
    <>
      <EnTete titre="Multi-sourcing" sous="Où diffusez-vous vos offres et d'où viennent vos meilleurs candidats ?" />
      <Carte titre="Offres publiées et canaux de diffusion">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Offre</th>{CANAUX_DIFFUSION.map((c) => <th key={c}>{c}</th>)}<th>Candidatures</th></tr></thead>
          <tbody>
            {offres.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td data-label="Offre" className="py-2"><Link href={`/admin/offres/${o.id}`} className="text-violet-700 font-semibold hover:underline">{o.titre}</Link></td>
                {CANAUX_DIFFUSION.map((c) => <td key={c} data-label={c}>{o.diffusion.includes(c) ? "✅" : "—"}</td>)}
                <td data-label="Candidatures">{o._count.candidatures}</td>
              </tr>
            ))}
            {offres.length === 0 && <tr><td colSpan={CANAUX_DIFFUSION.length + 2} className="py-4 text-gray-500">Aucune offre publiée.</td></tr>}
          </tbody>
        </table>
      </Carte>
      <Carte titre="Performance des sources">
        <ul className="flex flex-col gap-4">
          {parSource.map((s) => (
            <li key={s.source}>
              <div className="flex justify-between mb-1 text-sm"><span>{s.source}</span><span><b>{s._count._all}</b> candidats · {qualifies.get(s.source) ?? 0} qualifiés ou plus</span></div>
              <Jauge valeur={(s._count._all / total) * 100} />
            </li>
          ))}
          {parSource.length === 0 && <li className="text-gray-500">Pas encore de données.</li>}
        </ul>
      </Carte>
    </>
  );
}
