// lib/relances.ts : relances automatiques J+7, J+30, J+90 pour garder le vivier à jour.
import { prisma } from "@/lib/prisma";
import { REGLES_RELANCE } from "@/lib/constantes";
import { envoyerMail } from "@/lib/notifications";

/** Programme les trois relances d'un nouveau candidat (sans doublon) */
export async function planifierRelances(candidatId: string, depuis: Date = new Date()) {
  for (const [regle, def] of Object.entries(REGLES_RELANCE)) {
    const prevueLe = new Date(depuis.getTime() + def.jours * 86400000);
    await prisma.relance.upsert({
      where: { candidatId_regle: { candidatId, regle } },
      create: { candidatId, regle, prevueLe },
      update: {},
    });
  }
}

/** Les règles actives (réglage de l'écran Relances) */
export async function reglesActives(): Promise<Record<string, boolean>> {
  const lignes = await prisma.parametre.findMany({ where: { cle: { startsWith: "relance_" } } });
  const actives: Record<string, boolean> = { J7: true, J30: true, J90: true };
  for (const l of lignes) actives[l.cle.replace("relance_", "")] = l.valeur !== "0";
  return actives;
}

/** Envoie une relance (e-mail) et la marque comme envoyée */
export async function envoyerRelance(relanceId: string): Promise<boolean> {
  const r = await prisma.relance.findUnique({ where: { id: relanceId }, include: { candidat: true } });
  if (!r || r.envoyeeAt || !r.candidat.email || r.candidat.statut === "RECRUTE" || r.candidat.statut === "NON_RETENU") return false;
  const def = REGLES_RELANCE[r.regle];
  if (!def) return false;
  const ok = await envoyerMail({
    a: r.candidat.email,
    sujet: def.sujet,
    titre: `Bonjour ${r.candidat.prenom},`,
    lignes: [def.message, "Une simple réponse à ce message suffit. Vous pouvez aussi mettre à jour votre profil en postulant de nouveau sur notre site."],
    lien: "/offres",
    bouton: "Voir nos offres",
  });
  await prisma.relance.update({ where: { id: r.id }, data: { envoyeeAt: new Date() } });
  await prisma.candidat.update({ where: { id: r.candidatId }, data: { dernierContact: new Date() } });
  await prisma.note.create({ data: { candidatId: r.candidatId, type: "ECHANGE", texte: `Relance ${def.titre} (${def.objectif}) ${ok ? "envoyée par e-mail" : "enregistrée (e-mail non configuré)"}.`, auteur: "Automatique" } });
  return true;
}
