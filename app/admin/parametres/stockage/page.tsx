import { prisma } from "@/lib/prisma";
import { Carte, Chiffre, EnTete } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { migrerCvVersR2, verifierR2 } from "@/lib/actions/gestion";
import { etatReglages, nomStockage, r2Actif } from "@/lib/stockage";

export const dynamic = "force-dynamic";

export default async function Stockage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const actif = r2Actif();
  const [dansBase, dehors] = await Promise.all([
    prisma.candidat.count({ where: { cvData: { not: null } } }),
    prisma.candidat.count({ where: { cvCle: { not: null } } }),
  ]);
  return (
    <>
      <EnTete titre="Stockage des CV" sous="Les CV sont rangés chez un hébergeur de fichiers (OVHcloud conseillé : données en France). Sans réglage, ils restent dans la base Neon (0,5 Go en gratuit)." />
      <Alerte erreur={sp.erreur} ok={sp.ok} />
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Chiffre label="Stockage utilisé" valeur={nomStockage()} note={actif ? "les nouveaux CV y sont envoyés" : "pas encore configuré"} />
        <Chiffre label="CV chez l'hébergeur" valeur={dehors} />
        <Chiffre label="CV dans la base" valeur={dansBase} note={actif && dansBase ? "à déplacer" : undefined} />
      </div>

      <Carte titre="1. Réglages">
        <ul className="flex flex-col gap-1 text-sm mb-4">
          {etatReglages().map((v) => <li key={v.nom}>{v.ok ? "✅" : "❌"} <code>{v.nom}</code> {v.valeur && <span className="text-gray-500">· {v.valeur}</span>}</li>)}
        </ul>
        <form action={verifierR2}><BoutonAction>Tester la connexion</BoutonAction></form>
      </Carte>

      <Carte titre="2. Déplacer les CV existants">
        <p className="text-sm text-gray-600 mb-3">Les CV déposés avant ce réglage restent lisibles dans la base. Pour libérer de la place sur Neon, déplacez-les par lots de 40 (relancez jusqu&apos;à « Terminé »).</p>
        <form action={migrerCvVersR2}><BoutonAction confirmation="Déplacer jusqu'à 40 CV de la base vers l'hébergeur ?">{actif ? `Déplacer les CV (${dansBase} dans la base)` : "Configurez le stockage d'abord"}</BoutonAction></form>
      </Carte>

      <Carte titre="Mode d'emploi OVHcloud">
        <ol className="list-decimal pl-5 text-sm text-gray-700 flex flex-col gap-1">
          <li>ovhcloud.com → espace client → <b>Public Cloud</b> → créer un projet.</li>
          <li><b>Object Storage</b> → <b>Créer un conteneur</b> → <b>Standard (API S3)</b>, région Gravelines ou Paris, nom <code>franeo-jobs-cv</code>, accès privé.</li>
          <li><b>Utilisateurs S3</b> (ou Users &amp; Roles) → créer un utilisateur avec le rôle <b>ObjectStore operator</b> → récupérer la clé d&apos;accès et la clé secrète.</li>
          <li>Dans Vercel : <code>S3_ENDPOINT</code> (ex. https://s3.gra.io.cloud.ovh.net), <code>S3_REGION</code> (ex. gra), les deux clés et <code>S3_BUCKET</code>.</li>
          <li>Redéployez, revenez ici et cliquez <b>Tester la connexion</b>.</li>
        </ol>
      </Carte>
    </>
  );
}
