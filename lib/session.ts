import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

/**
 * Utilisateur connecté (administrateur FRANEO RH ou client).
 * `cache` : une seule requête à la base par affichage de page.
 * Un client dont l'entreprise est suspendue n'a plus aucun accès.
 */
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return null;

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: userId },
    include: { entreprise: true },
  });
  if (!utilisateur || !utilisateur.actif) return null;
  if (utilisateur.role === "CLIENT" && (!utilisateur.entreprise || utilisateur.entreprise.actif === false)) return null;
  if (utilisateur.role === "CANDIDAT" && !utilisateur.candidatId) return null;
  return utilisateur;
});

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/** À mettre en tête d'une page ou d'une action réservée à l'équipe FRANEO RH */
export async function exigerAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(accueilDuRole(session.role));
  return session;
}

/** À mettre en tête d'une page ou d'une action réservée aux clients */
export async function exigerClient(): Promise<Session & { entrepriseId: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "CLIENT" || !session.entrepriseId) redirect(accueilDuRole(session.role));
  return session as Session & { entrepriseId: string };
}

export const nomComplet = (s: { prenom: string; nom?: string | null }) => `${s.prenom}${s.nom ? " " + s.nom : ""}`.trim();

/** Page d'accueil de chaque type de compte */
export function accueilDuRole(role: string) {
  return role === "ADMIN" ? "/admin/dashboard" : role === "CANDIDAT" ? "/candidat" : "/client/dashboard";
}

/** À mettre en tête d'une page ou d'une action de l'espace candidat */
export async function exigerCandidat(): Promise<Session & { candidatId: string }> {
  const session = await getSession();
  if (!session) redirect("/espace-candidat");
  if (session.role !== "CANDIDAT" || !session.candidatId) redirect(accueilDuRole(session.role));
  return session as Session & { candidatId: string };
}
