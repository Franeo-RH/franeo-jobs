import { PagePublique } from "@/components/PublicBarre";

export const metadata = { title: "Confidentialité — Franeo Jobs" };

export default function Confidentialite() {
  return (
    <PagePublique>
      <div className="bg-white rounded-xl shadow p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Confidentialité et données personnelles</h1>
        <div className="space-y-4 text-gray-700">
          <p><strong>Qui traite vos données ?</strong> FRANEO RH, cabinet de recrutement, pour gérer votre candidature et vous proposer des missions adaptées à votre profil.</p>
          <p><strong>Quelles données ?</strong> Votre identité, vos coordonnées, votre CV, vos réponses au questionnaire de présélection et les échanges avec nos consultants.</p>
          <p><strong>Qui les voit ?</strong> L&apos;équipe FRANEO RH. Votre dossier n&apos;est transmis à une entreprise cliente que lorsque nous vous présentons pour l&apos;une de ses missions.</p>
          <p><strong>Combien de temps ?</strong> Vos données sont conservées 24 mois après votre dernier contact avec nous, puis supprimées ou anonymisées. Nous pouvons vous écrire à intervalles réguliers pour vérifier que vous êtes toujours en recherche.</p>
          <p><strong>Vos droits.</strong> Vous pouvez demander l&apos;accès, la correction ou la suppression de vos données à tout moment en écrivant à FRANEO RH à l&apos;adresse indiquée sur <a href="https://franeo-rh.com" className="text-violet-700 underline">franeo-rh.com</a>. Vous pouvez aussi saisir la CNIL.</p>
        </div>
      </div>
    </PagePublique>
  );
}
