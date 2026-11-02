import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnTete, Pastille } from "@/components/Coquille";
import BoutonExport from "@/components/BoutonExport";
import { formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Clients() {
  const clients = await prisma.entreprise.findMany({
    where: { demo: false }, orderBy: { createdAt: "desc" },
    include: { _count: { select: { missions: true, presentations: true } } },
  });
  return (
    <>
      <EnTete titre="Clients" sous={`${clients.length} entreprise${clients.length > 1 ? "s" : ""}`}>
        <BoutonExport type="clients" />
        <Link href="/admin/clients/nouveau" className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">➕ Ajouter un client</Link>
      </EnTete>
      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-3">Entreprise</th><th>Contact</th><th>Ville</th><th>Honoraires</th><th>Missions</th><th>Présentations</th><th>Accès</th><th>Créé le</th></tr></thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td data-label="Entreprise" className="py-3"><Link href={`/admin/clients/${c.id}`} className="font-semibold text-violet-700 hover:underline">{c.nom}</Link></td>
                <td data-label="Contact">{c.contactNom || "—"}</td>
                <td data-label="Ville">{c.ville || "—"}</td>
                <td data-label="Honoraires">{c.tauxHonoraires} %</td>
                <td data-label="Missions">{c._count.missions}</td>
                <td data-label="Présentations">{c._count.presentations}</td>
                <td data-label="Accès">{c.actif ? <Pastille label="Actif" def={{ label: "Actif", fond: "#dcfce7", texte: "#15803d" }} /> : <Pastille label="Suspendu" def={{ label: "Suspendu", fond: "#fee2e2", texte: "#b91c1c" }} />}</td>
                <td data-label="Créé le">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-500">Aucun client. Ajoutez le premier.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
