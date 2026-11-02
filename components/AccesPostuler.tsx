import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Les offres se consultent librement, mais pour postuler il faut être connecté à son espace candidat.
 * Renvoie le profil à préremplir si la personne est connectée, sinon null.
 */
export async function profilCandidatConnecte() {
  const s = await getSession();
  if (!s || s.role !== "CANDIDAT" || !s.candidatId) return null;
  const c = await prisma.candidat.findUnique({ where: { id: s.candidatId } });
  if (!c) return null;
  return {
    prenom: c.prenom, nom: c.nom, email: s.email, telephone: c.telephone ?? "", ville: c.ville ?? "", linkedin: c.linkedin ?? "",
    metier: c.metier === "Autres" ? "" : c.metier, poste: c.poste ?? "", experience: c.experience ?? "", niveau: c.niveau ?? "",
    disponibilite: c.disponibilite ?? "", mobilite: c.mobilite ?? "", teletravail: c.teletravail ?? "",
    salaireSouhaite: c.salaireSouhaite ? String(c.salaireSouhaite) : "", preavis: c.preavis ?? "", competences: c.competences.join(", "),
    aDejaCv: !!c.cvNom,
  };
}

/** Bloc affiché à la place du formulaire quand la personne n'est pas connectée */
export function ConnexionPourPostuler({ retour }: { retour: string }) {
  const r = encodeURIComponent(retour);
  return (
    <div className="text-center py-6">
      <p className="text-4xl mb-2">🔐</p>
      <p className="text-lg font-semibold">Connectez-vous pour postuler</p>
      <p className="text-gray-600 mt-2 max-w-md mx-auto">Votre espace candidat est gratuit : vous postulez en quelques clics avec un profil prérempli, et vous suivez où votre CV est envoyé et l&apos;avancement du recrutement.</p>
      <div className="flex gap-3 justify-center flex-wrap mt-5">
        <Link href={`/espace-candidat?retour=${r}`} className="fr-bouton-violet">Se connecter</Link>
        <Link href={`/espace-candidat?mode=inscription&retour=${r}`} className="bg-gray-100 text-gray-800 px-5 py-3 rounded-lg font-semibold hover:bg-gray-200">Créer mon espace</Link>
      </div>
    </div>
  );
}
