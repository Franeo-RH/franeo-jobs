import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Carte, EnTete } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import { relancerMaintenant, reglerRelance } from "@/lib/actions/candidats";
import { reglesActives } from "@/lib/relances";
import { REGLES_RELANCE, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Relances() {
  const [actives, aVenir, envoyees] = await Promise.all([
    reglesActives(),
    prisma.relance.findMany({ where: { envoyeeAt: null, candidat: { demo: false, email: { not: null } } }, orderBy: { prevueLe: "asc" }, take: 50, include: { candidat: true } }),
    prisma.relance.findMany({ where: { envoyeeAt: { not: null }, candidat: { demo: false } }, orderBy: { envoyeeAt: "desc" }, take: 20, include: { candidat: true } }),
  ]);
  return (
    <>
      <EnTete titre="Relances automatiques" sous="Un e-mail part tout seul chaque matin à 7 h pour garder votre vivier à jour" />
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {Object.entries(REGLES_RELANCE).map(([k, r]) => (
          <div key={k} className="bg-white rounded-xl shadow p-6">
            <p className="text-2xl font-bold text-violet-700">{r.titre}</p>
            <p className="font-semibold">{r.objectif}</p>
            <p className="text-sm text-gray-500 mt-1">« {r.sujet} »</p>
            <form action={reglerRelance} className="mt-4"><input type="hidden" name="regle" value={k} /><input type="hidden" name="actif" value={actives[k] ? "1" : "0"} />
              <BoutonAction className={`px-4 py-2 rounded-lg font-semibold ${actives[k] ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{actives[k] ? "✅ Active — désactiver" : "⏸ Désactivée — activer"}</BoutonAction></form>
          </div>
        ))}
      </div>
      <Carte titre="Relances programmées">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Candidat</th><th>Règle</th><th>Prévue le</th><th></th></tr></thead>
          <tbody>
            {aVenir.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td data-label="Candidat" className="py-2"><Link href={`/admin/candidats/${r.candidatId}`} className="text-violet-700 hover:underline">{r.candidat.prenom} {r.candidat.nom}</Link></td>
                <td data-label="Règle">{REGLES_RELANCE[r.regle]?.titre}</td><td data-label="Prévue le">{formatDate(r.prevueLe)}</td>
                <td data-label=""><form action={relancerMaintenant}><input type="hidden" name="id" value={r.id} /><BoutonAction confirmation="Envoyer cette relance maintenant ?" className="text-sm text-violet-700 underline">Envoyer maintenant</BoutonAction></form></td>
              </tr>
            ))}
            {aVenir.length === 0 && <tr><td colSpan={4} className="py-4 text-gray-500">Aucune relance en attente.</td></tr>}
          </tbody>
        </table>
      </Carte>
      <Carte titre="Dernières relances envoyées">
        <ul className="divide-y">{envoyees.map((r) => <li key={r.id} className="py-2 flex justify-between"><span>{r.candidat.prenom} {r.candidat.nom} · {REGLES_RELANCE[r.regle]?.titre}</span><span className="text-sm text-gray-500">{formatDate(r.envoyeeAt)}</span></li>)}{envoyees.length === 0 && <li className="py-2 text-gray-500">Aucune pour l&apos;instant.</li>}</ul>
      </Carte>
    </>
  );
}
