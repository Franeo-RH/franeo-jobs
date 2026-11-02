import { connection } from "next/server";
import { PagePublique } from "@/components/PublicBarre";
import FormulaireCandidature from "@/components/FormulaireCandidature";
import { ConnexionPourPostuler, profilCandidatConnecte } from "@/components/AccesPostuler";
import { QUESTIONNAIRES, cleParCategorie, questionnairePublic } from "@/lib/questionnaires";
import { CATEGORIES } from "@/lib/constantes";

export const metadata = { title: "Déposer mon CV — Franeo Jobs" };
export const dynamic = "force-dynamic";

export default async function CandidatureSpontanee({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const sp = await searchParams;
  const source = (Array.isArray(sp.source) ? sp.source[0] : sp.source) || "";
  const profil = await profilCandidatConnecte();
  return (
    <PagePublique>
      <div className="bg-white rounded-xl shadow p-8 mb-6">
        <h1 className="text-3xl font-bold">Déposer mon CV</h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Pas d&apos;offre qui vous correspond ? Laissez-nous votre CV. Il rejoint la CVthèque de FRANEO RH et nous vous contactons dès qu&apos;une mission correspond à votre profil. Vous pouvez le mettre à jour à tout moment depuis votre espace candidat.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow p-8">
        {!profil ? <ConnexionPourPostuler retour="/candidature-spontanee" /> : <FormulaireCandidature
          profil={profil}
          offre={null}
          cleFixe={null}
          questionnaires={Object.fromEntries(Object.keys(QUESTIONNAIRES).map((k) => [k, questionnairePublic(k)]))}
          parCategorie={Object.fromEntries(CATEGORIES.map((c) => [c, cleParCategorie(c)]))}
          categories={[...CATEGORIES]}
          source={source}
          questionnaireDeLOffre={null}
        />}
      </div>
    </PagePublique>
  );
}
