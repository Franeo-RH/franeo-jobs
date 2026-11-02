import { prisma } from "@/lib/prisma";
import { exigerAdmin } from "@/lib/session";
import { Carte, EnTete, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { basculerAcces, creerAdmin } from "@/lib/actions/gestion";

export const dynamic = "force-dynamic";

export default async function Equipe({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const moi = await exigerAdmin();
  const sp = await searchParams;
  const equipe = await prisma.utilisateur.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  return (
    <>
      <EnTete titre="Équipe FRANEO RH" sous="Les consultants qui ont accès à l'administration" />
      <Alerte erreur={sp.erreur} />
      <Carte>
        <table className="w-full text-left mb-6">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Nom</th><th>E-mail</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {equipe.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td data-label="Nom" className="py-2">{u.prenom} {u.nom}</td><td data-label="E-mail">{u.email}</td><td data-label="Statut">{u.actif ? "Actif" : "Désactivé"}</td>
                <td data-label="">{u.id !== moi.id && <form action={basculerAcces}><input type="hidden" name="id" value={u.id} /><BoutonAction className="text-sm text-violet-700 underline">{u.actif ? "Désactiver" : "Réactiver"}</BoutonAction></form>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 className="text-lg font-bold mb-3">Ajouter un consultant</h2>
        <form action={creerAdmin} className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <input name="prenom" placeholder="Prénom" className={champ} /><input name="nom" placeholder="Nom" className={champ} />
          <input name="email" type="email" placeholder="E-mail *" className={champ} required />
          <input name="motDePasse" placeholder="Mot de passe provisoire *" minLength={8} className={champ} required />
          <div><BoutonAction>Ajouter</BoutonAction></div>
        </form>
      </Carte>
    </>
  );
}
