import { prisma } from "@/lib/prisma";
import { EnTete } from "@/components/Coquille";
import BoutonExport from "@/components/BoutonExport";
import { TYPES_REGISTRE, formatDateHeure } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Registre() {
  const lignes = await prisma.journalRegistre.findMany({ orderBy: { createdAt: "desc" }, take: 300, where: { OR: [{ presentation: { is: { entreprise: { demo: false } } } }, { presentationId: null }] } });
  return (
    <>
      <EnTete titre="Journal anti-litiges" sous="Chaque envoi, ouverture, consultation, téléchargement et réponse est horodaté. Il ne peut ni être modifié ni supprimé.">
        <BoutonExport type="registre" />
      </EnTete>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Date</th><th>Événement</th><th>Détail</th><th>Acteur</th></tr></thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td data-label="Date" className="py-2 whitespace-nowrap">{formatDateHeure(l.createdAt)}</td>
                <td data-label="Événement">{TYPES_REGISTRE[l.type]?.icone} {TYPES_REGISTRE[l.type]?.label ?? l.type}</td>
                <td data-label="Détail">{l.detail}</td><td data-label="Acteur">{l.acteur}</td>
              </tr>
            ))}
            {lignes.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500">Le registre est vide.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
