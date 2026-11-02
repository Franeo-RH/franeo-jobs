import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnTete, Pastille, Chiffre } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import BoutonExport from "@/components/BoutonExport";
import { statutFacture } from "@/lib/actions/gestion";
import { STATUTS_FACTURE, euros, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Facturation() {
  const factures = await prisma.facture.findMany({ where: { entreprise: { demo: false } }, orderBy: { createdAt: "desc" }, include: { candidat: true, entreprise: true, mission: true } });
  const somme = (st?: string) => factures.filter((f) => !st || f.statut === st).reduce((t, f) => t + f.honoraires, 0);
  const prochain = (statut: string) => (statut === "A_EMETTRE" ? "ENVOYEE" : statut === "ENVOYEE" ? "PAYEE" : null);
  const libelle: Record<string, string> = { ENVOYEE: "Marquer envoyée", PAYEE: "Marquer payée" };
  return (
    <>
      <EnTete titre="Facturation" sous="Honoraires calculés à l'embauche (% du salaire annuel brut) avec fin de garantie">
        <BoutonExport type="facturation" />
      </EnTete>
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Chiffre label="Total honoraires" valeur={euros(somme())} />
        <Chiffre label="À émettre" valeur={euros(somme("A_EMETTRE"))} />
        <Chiffre label="Envoyées" valeur={euros(somme("ENVOYEE"))} />
        <Chiffre label="Encaissées" valeur={euros(somme("PAYEE"))} />
      </div>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Client</th><th>Candidat</th><th>Mission</th><th>Salaire</th><th>Taux</th><th>Honoraires</th><th>Embauche</th><th>Fin de garantie</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {factures.map((f) => {
              const suite = prochain(f.statut);
              return (
                <tr key={f.id} className="border-b last:border-0">
                  <td data-label="Client" className="py-3">{f.entreprise.nom}</td>
                  <td data-label="Candidat"><Link href={`/admin/candidats/${f.candidatId}`} className="text-violet-700 hover:underline">{f.candidat.prenom} {f.candidat.nom}</Link></td>
                  <td data-label="Mission">{f.mission.reference}</td><td data-label="Salaire">{euros(f.salaireAnnuel)}</td><td data-label="Taux">{f.taux} %</td>
                  <td data-label="Honoraires"><b>{euros(f.honoraires)}</b></td><td data-label="Embauche">{formatDate(f.dateEmbauche)}</td><td data-label="Fin de garantie">{formatDate(f.finGarantie)}</td>
                  <td data-label="Statut"><Pastille def={STATUTS_FACTURE[f.statut]} /></td>
                  <td data-label="">{suite && <form action={statutFacture}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="statut" value={suite} /><BoutonAction className="text-sm text-violet-700 underline">{libelle[suite]}</BoutonAction></form>}</td>
                </tr>
              );
            })}
            {factures.length === 0 && <tr><td colSpan={10} className="py-8 text-center text-gray-500">Aucune facture. Elles se créent quand vous marquez un candidat « Embauché » dans le pipeline.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
