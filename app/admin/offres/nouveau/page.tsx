import { prisma } from "@/lib/prisma";
import { EnTete, Carte } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import FormulaireOffre from "@/components/FormulaireOffre";
import { creerOffre } from "@/lib/actions/gestion";

export const dynamic = "force-dynamic";

export default async function NouvelleOffre({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const missions = await prisma.mission.findMany({ where: { entreprise: { demo: false } }, orderBy: { createdAt: "desc" }, include: { entreprise: { select: { nom: true } } } });
  const m = sp.missionId ? missions.find((x) => x.id === sp.missionId) : undefined;
  return (
    <>
      <EnTete titre="Créer une offre" sous="Elle sera visible sur la page publique « Offres » dès sa publication" />
      <Alerte erreur={sp.erreur} />
      <Carte>
        <FormulaireOffre action={creerOffre} creation missions={missions}
          v={m ? { missionId: m.id, titre: m.poste, lieu: m.lieu, categorie: m.categorie, contrat: m.contrat, competences: m.competences, description: m.description ?? "" } : {}} />
      </Carte>
    </>
  );
}
