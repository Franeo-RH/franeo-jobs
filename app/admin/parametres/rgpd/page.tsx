import { prisma } from "@/lib/prisma";
import { Carte, EnTete } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { anonymiserAnciens } from "@/lib/actions/candidats";
import { formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Rgpd({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const limite = new Date();
  limite.setMonth(limite.getMonth() - 24);
  const anciens = await prisma.candidat.findMany({ where: { demo: false, dernierContact: { lt: limite }, NOT: { nom: "RGPD" } }, orderBy: { dernierContact: "asc" }, take: 100, select: { id: true, prenom: true, nom: true, dernierContact: true } });
  const sansConsentement = await prisma.candidat.count({ where: { demo: false, consentementAt: null, NOT: { nom: "RGPD" } } });
  return (
    <>
      <EnTete titre="RGPD" sous="Les candidatures sont conservées 24 mois après le dernier contact, puis effacées" />
      <Alerte ok={sp.ok} />
      <Carte titre="Profils à effacer (plus de 24 mois sans contact)">
        {anciens.length === 0 ? <p className="text-gray-500">Aucun profil concerné. 🎉</p> : (
          <>
            <ul className="divide-y mb-5">{anciens.map((c) => <li key={c.id} className="py-2 flex justify-between"><span>{c.prenom} {c.nom}</span><span className="text-sm text-gray-500">dernier contact : {formatDate(c.dernierContact)}</span></li>)}</ul>
            <form action={anonymiserAnciens}><BoutonAction confirmation="Effacer les données personnelles de tous ces profils ? Cette action est irréversible." className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700">Anonymiser ces profils</BoutonAction></form>
          </>
        )}
      </Carte>
      <Carte titre="Bonnes pratiques">
        <ul className="list-disc pl-5 text-sm text-gray-700 flex flex-col gap-1">
          <li>Chaque candidat coche une case de consentement avant d&apos;envoyer son CV.</li>
          <li>{sansConsentement} profil(s) sans consentement enregistré (ajoutés manuellement ou importés).</li>
          <li>Un candidat peut demander l&apos;effacement : utilisez « Anonymiser » sur sa fiche.</li>
          <li>Le registre des présentations est conservé de façon anonyme : il protège vos droits face aux clients.</li>
          <li>Les relances J+7 / J+30 / J+90 maintiennent le contact et la mise à jour des données.</li>
        </ul>
      </Carte>
    </>
  );
}
