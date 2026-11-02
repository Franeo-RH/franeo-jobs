import { prisma } from "@/lib/prisma";
import { Carte, EnTete } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import { traiterDemande } from "@/lib/actions/gestion";
import { formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Demandes() {
  const demandes = await prisma.demandeInscription.findMany({ orderBy: [{ statut: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <>
      <EnTete titre="Demandes d'accès" sous="Entreprises qui souhaitent recevoir des candidats (depuis la démo ou la page de connexion)" />
      <Carte>
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Société</th><th>Contact</th><th>E-mail</th><th>Téléphone</th><th>Message</th><th>Reçue le</th><th></th></tr></thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td data-label="Société" className="py-2 font-semibold">{d.societe}</td><td data-label="Contact">{d.prenom} {d.nom}</td>
                <td data-label="E-mail"><a href={`mailto:${d.email}`} className="text-violet-700 underline">{d.email}</a></td><td data-label="Téléphone">{d.telephone || "—"}</td>
                <td data-label="Message">{d.message || "—"}</td><td data-label="Reçue le">{formatDate(d.createdAt)}</td>
                <td data-label="">{d.statut === "NOUVELLE" ? <form action={traiterDemande}><input type="hidden" name="id" value={d.id} /><BoutonAction className="text-sm text-violet-700 underline">Marquer traitée</BoutonAction></form> : <span className="text-sm text-green-700">Traitée</span>}</td>
              </tr>
            ))}
            {demandes.length === 0 && <tr><td colSpan={7} className="py-6 text-gray-500">Aucune demande.</td></tr>}
          </tbody>
        </table>
      </Carte>
    </>
  );
}
