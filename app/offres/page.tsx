import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, CONTRATS } from "@/lib/constantes";
import { PagePublique } from "@/components/PublicBarre";

export const metadata = { title: "Offres d'emploi — Franeo Jobs" };
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export default async function Offres({ searchParams }: { searchParams: SP }) {
  await connection();
  const sp = await searchParams;
  const q = un(sp.q).trim();
  const metier = un(sp.metier);
  const contrat = un(sp.contrat);
  const source = un(sp.source);

  const offres = await prisma.offre.findMany({
    where: {
      statut: "PUBLIEE",
      ...(metier ? { categorie: metier } : {}),
      ...(contrat ? { contrat } : {}),
      ...(q ? { OR: [{ titre: { contains: q, mode: "insensitive" } }, { lieu: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { publieeAt: "desc" },
  });

  return (
    <PagePublique>
      <div className="bg-white rounded-xl shadow p-8 mb-6">
        <h1 className="text-3xl font-bold">Trouvez votre prochain poste</h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          FRANEO RH recrute pour des entreprises de toute la région. Postulez en quelques minutes, sans créer de compte, ou déposez simplement votre CV : nous vous recontactons dès qu&apos;une mission vous correspond.
        </p>
        <div className="mt-5 flex gap-3 flex-wrap">
          <Link href={`/candidature-spontanee${source ? `?source=${encodeURIComponent(source)}` : ""}`} className="fr-bouton-violet">📄 Déposer mon CV</Link>
        </div>
      </div>

      <form method="get" className="bg-white rounded-xl shadow p-6 mb-6 flex gap-3 flex-wrap items-end">
        {source && <input type="hidden" name="source" value={source} />}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="q" className="block text-sm font-semibold mb-1">Poste ou ville</label>
          <input id="q" name="q" defaultValue={q} placeholder="Ex. commercial, Nancy" className="w-full border rounded-lg px-4 py-3 text-black" />
        </div>
        <div>
          <label htmlFor="metier" className="block text-sm font-semibold mb-1">Métier</label>
          <select id="metier" name="metier" defaultValue={metier} className="border rounded-lg px-4 py-3 text-black bg-white">
            <option value="">Tous</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="contrat" className="block text-sm font-semibold mb-1">Contrat</label>
          <select id="contrat" name="contrat" defaultValue={contrat} className="border rounded-lg px-4 py-3 text-black bg-white">
            <option value="">Tous</option>
            {CONTRATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button type="submit" className="fr-bouton-violet">Rechercher</button>
      </form>

      {offres.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="font-semibold">Aucune offre ne correspond pour le moment.</p>
          <p className="text-gray-500 mt-1">Déposez votre CV : nous vous contacterons dès qu&apos;une mission vous correspond.</p>
          <Link href="/candidature-spontanee" className="fr-bouton-violet mt-4">Déposer mon CV</Link>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {offres.map((o) => (
            <Link key={o.id} href={`/offres/${o.slug}${source ? `?source=${encodeURIComponent(source)}` : ""}`} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition block">
              <span className="fr-pastille" style={{ background: "#ede9fe", color: "#6d28d9" }}>{o.categorie}</span>
              <h2 className="text-xl font-bold mt-3">{o.titre}</h2>
              <p className="text-gray-600 mt-1">📍 {o.lieu} · {o.contrat}{o.salaire ? ` · ${o.salaire}` : ""}</p>
              <p className="text-gray-500 text-sm mt-3 line-clamp-3">{o.description}</p>
              <p className="text-violet-700 font-semibold mt-4">Voir l&apos;offre et postuler →</p>
            </Link>
          ))}
        </div>
      )}
    </PagePublique>
  );
}
