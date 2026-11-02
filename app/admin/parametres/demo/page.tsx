import { prisma } from "@/lib/prisma";
import { Carte, EnTete } from "@/components/Coquille";
import BoutonResetDemo from "@/components/BoutonResetDemo";
import { EMAIL_DEMO } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function Demo() {
  const e = await prisma.entreprise.findFirst({ where: { demo: true }, include: { _count: { select: { missions: true, presentations: true } } } });
  return (
    <>
      <EnTete titre="Démo" sous="Un faux client avec des candidats fictifs, pour faire essayer l'outil sans inscription" />
      <Carte titre="État de la démo">
        {e ? <p>{e.nom} · {e._count.missions} missions · {e._count.presentations} présentations fictives · compte {EMAIL_DEMO}</p> : <p className="text-gray-500">La démo se crée au premier clic sur « Tester la démo » depuis la page de connexion.</p>}
        <p className="text-sm text-gray-500 mt-3">Les données de la démo n&apos;apparaissent jamais dans vos listes, statistiques ni exports. Elle se remet à zéro automatiquement chaque nuit à 2 h.</p>
        <div className="mt-4"><BoutonResetDemo /></div>
      </Carte>
    </>
  );
}
