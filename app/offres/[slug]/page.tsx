import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { PagePublique } from "@/components/PublicBarre";
import FormulaireCandidature from "@/components/FormulaireCandidature";
import { ConnexionPourPostuler, profilCandidatConnecte } from "@/components/AccesPostuler";
import { QUESTIONNAIRES, cleDeLOffre, cleParCategorie, questionnairePublic } from "@/lib/questionnaires";
import { CATEGORIES } from "@/lib/constantes";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const o = await prisma.offre.findUnique({ where: { slug }, select: { titre: true, lieu: true } }).catch(() => null);
  return { title: o ? `${o.titre} — ${o.lieu} — Franeo Jobs` : "Offre — Franeo Jobs" };
}

export default async function OffrePage({ params, searchParams }: Props) {
  await connection();
  const { slug } = await params;
  const sp = await searchParams;
  const source = (Array.isArray(sp.source) ? sp.source[0] : sp.source) || "";
  const offre = await prisma.offre.findUnique({ where: { slug } });
  if (!offre || offre.statut === "BROUILLON" || offre.statut === "ARCHIVEE") notFound();

  const ouverte = offre.statut === "PUBLIEE";
  const cle = cleDeLOffre(offre);
  const quest = cle ? questionnairePublic(cle) : null;
  const profil = await profilCandidatConnecte();
  const liste = (t: string | null) => (t || "").split("\n").map((l) => l.replace(/^[-•\s]+/, "").trim()).filter(Boolean);

  return (
    <PagePublique>
      <Link href="/offres" className="text-violet-700 font-semibold hover:underline">← Toutes les offres</Link>
      <div className="bg-white rounded-xl shadow p-8 my-4">
        <span className="fr-pastille" style={{ background: "#ede9fe", color: "#6d28d9" }}>{offre.categorie}</span>
        <h1 className="text-3xl font-bold mt-3">{offre.titre}</h1>
        <p className="text-gray-600 mt-2">📍 {offre.lieu} · {offre.contrat}{offre.salaire ? ` · ${offre.salaire}` : ""}</p>
        {!ouverte && <p className="mt-4 rounded-lg bg-amber-50 text-amber-800 px-4 py-3 font-semibold">Cette offre n&apos;accepte plus de candidatures pour le moment. Vous pouvez déposer votre CV : nous vous recontacterons pour une mission similaire.</p>}

        <h2 className="text-xl font-bold mt-6 mb-2">Le poste</h2>
        <p className="whitespace-pre-line text-gray-700">{offre.description}</p>
        {liste(offre.taches).length > 0 && (<><h2 className="text-xl font-bold mt-6 mb-2">Vos missions</h2><ul className="list-disc pl-6 text-gray-700 space-y-1">{liste(offre.taches).map((l) => <li key={l}>{l}</li>)}</ul></>)}
        {liste(offre.profil).length > 0 && (<><h2 className="text-xl font-bold mt-6 mb-2">Votre profil</h2><ul className="list-disc pl-6 text-gray-700 space-y-1">{liste(offre.profil).map((l) => <li key={l}>{l}</li>)}</ul></>)}
        {offre.competences.length > 0 && (<div className="flex gap-2 flex-wrap mt-4">{offre.competences.map((c) => <span key={c} className="fr-pastille" style={{ background: "#f3f4f6", color: "#374151" }}>{c}</span>)}</div>)}
        {liste(offre.avantages).length > 0 && (<><h2 className="text-xl font-bold mt-6 mb-2">Avantages</h2><ul className="list-disc pl-6 text-gray-700 space-y-1">{liste(offre.avantages).map((l) => <li key={l}>{l}</li>)}</ul></>)}
      </div>

      <div className="bg-white rounded-xl shadow p-8" id="postuler">
        <h2 className="text-2xl font-bold mb-1">{ouverte ? "Postuler à cette offre" : "Déposer mon CV"}</h2>
        <p className="text-gray-500 mb-6">{profil ? `Connecté en tant que ${profil.prenom} : vos informations sont déjà remplies.` : "Réservé aux candidats connectés à leur espace."}</p>
        {!profil ? <ConnexionPourPostuler retour={`/offres/${offre.slug}${source ? `?source=${encodeURIComponent(source)}` : ""}#postuler`} /> : <FormulaireCandidature
          profil={profil}
          offre={ouverte ? { id: offre.id, titre: offre.titre, categorie: offre.categorie } : null}
          cleFixe={ouverte ? cle : null}
          questionnaires={Object.fromEntries(Object.keys(QUESTIONNAIRES).map((k) => [k, questionnairePublic(k)]))}
          parCategorie={Object.fromEntries(CATEGORIES.map((c) => [c, cleParCategorie(c)]))}
          categories={[...CATEGORIES]}
          source={source}
          questionnaireDeLOffre={quest ? quest.cle : null}
        />}
      </div>
    </PagePublique>
  );
}
