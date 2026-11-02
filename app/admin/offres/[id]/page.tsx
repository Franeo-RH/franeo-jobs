import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Carte, EnTete, Pastille } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import FormulaireOffre from "@/components/FormulaireOffre";
import { majOffre, statutOffre } from "@/lib/actions/gestion";
import { STATUTS_OFFRE, formatDate } from "@/lib/constantes";
import { APP_URL } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function FicheOffre({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.offre.findUnique({ where: { id }, include: { candidatures: { include: { candidat: true }, orderBy: { createdAt: "desc" } } } });
  if (!o) notFound();
  const bouton = (statut: string, label: string, conf?: string) => (
    <form action={statutOffre}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="statut" value={statut} />
      <BoutonAction confirmation={conf} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200">{label}</BoutonAction></form>
  );
  return (
    <>
      <EnTete titre={o.titre} sous={<><Pastille def={STATUTS_OFFRE[o.statut]} /> · {o.lieu} · {o.contrat}</>}>
        {o.statut === "PUBLIEE" && <Link href={`/offres/${o.slug}`} target="_blank" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200">Voir la page publique ↗</Link>}
        {o.statut !== "PUBLIEE" && o.statut !== "ARCHIVEE" && bouton("PUBLIEE", "🚀 Publier")}
        {o.statut === "PUBLIEE" && bouton("SUSPENDUE", "⏸ Suspendre")}
        {o.statut === "PUBLIEE" && bouton("POURVUE", "✅ Marquer pourvue")}
        {o.statut !== "ARCHIVEE" && bouton("ARCHIVEE", "🗄 Archiver", "Archiver cette offre ? Elle ne sera plus visible.")}
      </EnTete>
      {o.statut === "PUBLIEE" && (
        <Carte titre="Liens de diffusion (multi-sourcing)">
          <p className="text-sm text-gray-500 mb-3">Collez le lien correspondant dans chaque annonce : la source de chaque candidature sera enregistrée automatiquement.</p>
          <ul className="flex flex-col gap-2 text-sm">
            {["LinkedIn", "Indeed", "APEC", "Cooptation", "Réseau Franeo"].map((s) => (
              <li key={s} className="flex gap-3 flex-wrap items-center"><b className="w-28">{s}</b><code className="bg-gray-100 rounded px-2 py-1 break-all select-all">{`${APP_URL}/offres/${o.slug}?source=${encodeURIComponent(s)}`}</code></li>
            ))}
          </ul>
        </Carte>
      )}
      <Carte titre="Modifier l'offre"><FormulaireOffre action={majOffre} v={o} /></Carte>
      <Carte titre={`Candidatures reçues (${o.candidatures.length})`}>
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Candidat</th><th>Test</th><th>Reçue le</th></tr></thead>
          <tbody>
            {o.candidatures.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td data-label="Candidat" className="py-2"><Link href={`/admin/candidats/${c.candidatId}`} className="text-violet-700 font-semibold hover:underline">{c.candidat.prenom} {c.candidat.nom}</Link></td>
                <td data-label="Test">{c.scoreTest != null ? `${c.scoreTest}/100` : "—"}{c.aRelire ? " ✍️" : ""}{o.seuilTest > 0 && c.scoreTest != null && (c.scoreTest >= o.seuilTest ? " ✅" : " ⚠️ sous le seuil")}{c.retireeAt ? " · retirée" : ""}</td><td data-label="Reçue le">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {o.candidatures.length === 0 && <tr><td colSpan={3} className="py-4 text-gray-500">Aucune candidature pour le moment.</td></tr>}
          </tbody>
        </table>
      </Carte>
    </>
  );
}
