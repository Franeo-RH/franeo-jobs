import { prisma } from "@/lib/prisma";
import { Carte, Chiffre, EnTete } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { migrerCvVersR2, verifierR2 } from "@/lib/actions/gestion";
import { r2Actif } from "@/lib/stockage";

export const dynamic = "force-dynamic";

export default async function Stockage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const actif = r2Actif();
  const [dansBase, dansR2] = await Promise.all([
    prisma.candidat.count({ where: { cvData: { not: null } } }),
    prisma.candidat.count({ where: { cvCle: { not: null } } }),
  ]);
  const variables = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
  return (
    <>
      <EnTete titre="Stockage des CV" sous="Cloudflare R2 : 10 Go gratuits pour les CV. Sans réglage, les CV sont rangés dans la base Neon (0,5 Go en gratuit)." />
      <Alerte erreur={sp.erreur} ok={sp.ok} />
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Chiffre label="Stockage utilisé" valeur={actif ? "Cloudflare R2" : "Base Neon"} note={actif ? "nouveaux CV dans R2" : "R2 pas encore configuré"} />
        <Chiffre label="CV dans R2" valeur={dansR2} />
        <Chiffre label="CV dans la base" valeur={dansBase} note={actif && dansBase ? "à déplacer vers R2" : undefined} />
      </div>

      <Carte titre="1. Réglages">
        <ul className="flex flex-col gap-1 text-sm mb-4">
          {variables.map((v) => <li key={v}>{process.env[v] ? "✅" : "❌"} <code>{v}</code></li>)}
        </ul>
        <form action={verifierR2}><BoutonAction>Tester la connexion à R2</BoutonAction></form>
      </Carte>

      <Carte titre="2. Déplacer les CV existants vers R2">
        <p className="text-sm text-gray-600 mb-3">Les CV déposés avant l&apos;activation de R2 restent lisibles dans la base. Pour libérer de la place sur Neon, déplacez-les par lots de 40 (relancez jusqu&apos;à ce qu&apos;il n&apos;en reste plus).</p>
        <form action={migrerCvVersR2}><BoutonAction confirmation="Déplacer jusqu'à 40 CV de la base vers R2 ?">{actif ? `Déplacer les CV (${dansBase} restants)` : "Configurez R2 d'abord"}</BoutonAction></form>
      </Carte>

      <Carte titre="Mode d'emploi R2">
        <ol className="list-decimal pl-5 text-sm text-gray-700 flex flex-col gap-1">
          <li>dash.cloudflare.com → <b>R2 Object Storage</b> → activer R2 (carte demandée, rien n&apos;est facturé sous 10 Go).</li>
          <li><b>Create bucket</b> → nom <code>franeo-jobs-cv</code>, accès privé.</li>
          <li><b>Manage R2 API Tokens</b> → <b>Create API token</b> → <b>Object Read &amp; Write</b>, limité au bucket <code>franeo-jobs-cv</code>.</li>
          <li>Copiez Account ID, Access Key ID et Secret Access Key dans Vercel (Settings → Environment Variables) et dans votre fichier <code>.env</code>.</li>
          <li>Redéployez sur Vercel, revenez ici et cliquez <b>Tester la connexion à R2</b>.</li>
        </ol>
      </Carte>
    </>
  );
}
