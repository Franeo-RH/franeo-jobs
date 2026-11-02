// lib/registre.ts
// Registre anti-litiges : on ajoute des lignes horodatées, on ne modifie ni ne supprime jamais.
import { prisma } from "@/lib/prisma";

export async function journaliser(entree: {
  type: "ENVOI" | "OUVERTURE" | "CONSULTATION" | "TELECHARGEMENT_CV" | "REPONSE" | "DOUBLON_FORCE" | "ECHANGE";
  detail: string;
  acteur: string;
  presentationId?: string | null;
  candidatId?: string | null;
  entrepriseId?: string | null;
}) {
  return prisma.journalRegistre.create({
    data: {
      type: entree.type,
      detail: entree.detail,
      acteur: entree.acteur,
      presentationId: entree.presentationId ?? null,
      candidatId: entree.candidatId ?? null,
      entrepriseId: entree.entrepriseId ?? null,
    },
  });
}

/** Une présentation de ce candidat à ce client existe-t-elle déjà ? (contrôle automatique avant envoi) */
export async function presentationAnterieure(candidatId: string, entrepriseId: string) {
  return prisma.presentation.findFirst({
    where: { candidatId, entrepriseId },
    orderBy: { envoyeAt: "desc" },
    include: { mission: { select: { reference: true, poste: true } } },
  });
}
