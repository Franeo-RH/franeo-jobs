import { PagePublique } from "@/components/PublicBarre";
import { Carte, EnTete } from "@/components/Coquille";
import InstallerApp from "@/components/InstallerApp";
import { APP_URL } from "@/lib/notifications";

export const metadata = { title: "Installer l'application — Franeo Jobs" };
export const dynamic = "force-dynamic";

export default function Installer() {
  return (
    <PagePublique>
      <EnTete titre="📲 Franeo Jobs sur votre téléphone" sous="Installez l'application en quelques secondes : une icône sur votre écran d'accueil, ouverture en plein écran, sans passer par l'App Store ni Google Play.">
        <InstallerApp className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700" />
      </EnTete>

      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <Carte titre=" iPhone et iPad" className="!mb-0">
          <ol className="list-decimal pl-5 flex flex-col gap-2 text-gray-700">
            <li>Ouvrez <b>{APP_URL.replace(/^https?:\/\//, "")}</b> avec <b>Safari</b> (obligatoire sur iPhone).</li>
            <li>Touchez le bouton <b>Partager</b> (le carré avec une flèche vers le haut, en bas de l&apos;écran).</li>
            <li>Faites défiler et touchez <b>« Sur l&apos;écran d&apos;accueil »</b>.</li>
            <li>Touchez <b>Ajouter</b> : l&apos;icône Franeo Jobs apparaît sur votre écran.</li>
          </ol>
        </Carte>
        <Carte titre="🤖 Android" className="!mb-0">
          <ol className="list-decimal pl-5 flex flex-col gap-2 text-gray-700">
            <li>Ouvrez <b>{APP_URL.replace(/^https?:\/\//, "")}</b> avec <b>Chrome</b>.</li>
            <li>Touchez le bouton <b>« Installer l&apos;application »</b> en haut de cette page s&apos;il apparaît.</li>
            <li>Sinon : menu <b>⋮</b> en haut à droite, puis <b>« Installer l&apos;application »</b> ou <b>« Ajouter à l&apos;écran d&apos;accueil »</b>.</li>
            <li>Confirmez : l&apos;application s&apos;installe comme une application classique.</li>
          </ol>
        </Carte>
        <Carte titre="💻 Ordinateur" className="!mb-0">
          <ol className="list-decimal pl-5 flex flex-col gap-2 text-gray-700">
            <li>Avec <b>Chrome</b> ou <b>Edge</b> : cliquez sur l&apos;icône d&apos;installation à droite de la barre d&apos;adresse.</li>
            <li>Avec <b>Safari sur Mac</b> : menu <b>Fichier</b>, puis <b>« Ajouter au Dock »</b>.</li>
          </ol>
        </Carte>
      </div>

      <Carte titre="Pourquoi installer l'application ?" className="mt-6">
        <ul className="list-disc pl-5 text-gray-700 flex flex-col gap-1">
          <li>Candidats : consultez les offres, postulez et suivez vos candidatures en un geste.</li>
          <li>Entreprises : recevez et évaluez les candidats présentés où que vous soyez.</li>
          <li>Toujours à jour : l&apos;application se met à jour automatiquement, rien à télécharger.</li>
        </ul>
      </Carte>
    </PagePublique>
  );
}
