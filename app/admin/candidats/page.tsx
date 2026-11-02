import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnTete, Pastille, champ } from "@/components/Coquille";
import BoutonExport from "@/components/BoutonExport";
import { whereCandidats } from "@/lib/filtres-candidats";
import { CATEGORIES, DISPONIBILITES, SOURCES, STATUTS_CANDIDAT, TELETRAVAIL, euros, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Candidats({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const un = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const [candidats, total] = await Promise.all([
    prisma.candidat.findMany({ where: whereCandidats(sp), orderBy: { createdAt: "desc" }, take: 200, select: { id: true, prenom: true, nom: true, metier: true, poste: true, ville: true, statut: true, source: true, disponibilite: true, salaireSouhaite: true, scoreTest: true, createdAt: true, cvNom: true } }),
    prisma.candidat.count({ where: { demo: false } }),
  ]);
  const sel = (nom: string, options: string[], label: string) => (
    <select name={nom} defaultValue={un(nom)} className={champ} aria-label={label}><option value="">{label}</option>{options.map((o) => <option key={o}>{o}</option>)}</select>
  );
  return (
    <>
      <EnTete titre="CVthèque et vivier" sous={`${candidats.length} résultat${candidats.length > 1 ? "s" : ""} sur ${total} candidats`}>
        <BoutonExport type="candidats" />
        <Link href="/admin/candidats/nouveau" className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">➕ Ajouter un candidat</Link>
      </EnTete>
      <form className="bg-white rounded-xl shadow p-6 mb-6 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <input name="q" defaultValue={un("q")} placeholder="Nom, poste, ville, e-mail…" className={champ} />
        {sel("metier", [...CATEGORIES], "Tous les métiers")}
        <select name="statut" defaultValue={un("statut")} className={champ} aria-label="Statut"><option value="">Tous les statuts</option>{Object.entries(STATUTS_CANDIDAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        {sel("source", SOURCES, "Toutes les sources")}
        {sel("dispo", DISPONIBILITES, "Toute disponibilité")}
        {sel("teletravail", TELETRAVAIL, "Télétravail")}
        <select name="salaire" defaultValue={un("salaire")} className={champ} aria-label="Salaire"><option value="">Tout salaire</option><option value="moins35">Moins de 35 k€</option><option value="35-45">35 à 45 k€</option><option value="plus45">Plus de 45 k€</option></select>
        <input name="competence" defaultValue={un("competence")} placeholder="Compétence exacte" className={champ} />
        <div className="flex gap-2"><button className="bg-violet-600 text-white px-5 py-3 rounded-lg font-semibold">Filtrer</button><Link href="/admin/candidats" className="bg-gray-100 px-4 py-3 rounded-lg font-semibold">Effacer</Link></div>
      </form>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Candidat</th><th>Métier</th><th>Ville</th><th>Statut</th><th>Source</th><th>Dispo</th><th>Salaire</th><th>Test</th><th>CV</th><th>Reçu le</th></tr></thead>
          <tbody>
            {candidats.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td data-label="Candidat" className="py-3"><Link href={`/admin/candidats/${c.id}`} className="font-semibold text-violet-700 hover:underline">{c.prenom} {c.nom}</Link><p className="text-xs text-gray-500">{c.poste || "—"}</p></td>
                <td data-label="Métier">{c.metier}</td><td data-label="Ville">{c.ville || "—"}</td>
                <td data-label="Statut"><Pastille def={STATUTS_CANDIDAT[c.statut]} /></td><td data-label="Source">{c.source}</td>
                <td data-label="Dispo">{c.disponibilite || "—"}</td><td data-label="Salaire">{euros(c.salaireSouhaite)}</td>
                <td data-label="Test">{c.scoreTest != null ? `${c.scoreTest}/100` : "—"}</td>
                <td data-label="CV">{c.cvNom ? <a href={`/api/candidats/${c.id}/cv`} className="text-violet-700 underline">📄</a> : "—"}</td>
                <td data-label="Reçu le">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {candidats.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-gray-500">Aucun candidat ne correspond.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
