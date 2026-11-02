// lib/alertes.ts : alertes e-mail envoyées aux candidats quand une offre de leur métier est publiée.
import { prisma } from "@/lib/prisma";
import { envoyerMail } from "@/lib/notifications";

export async function envoyerAlertesOffre(offreId: string) {
  const o = await prisma.offre.findUnique({ where: { id: offreId } });
  if (!o || o.statut !== "PUBLIEE") return 0;
  const candidats = await prisma.candidat.findMany({
    where: { demo: false, email: { not: null }, alertesMetiers: { has: o.categorie }, statut: { not: "RECRUTE" }, compte: { is: { actif: true } } },
    select: { id: true, prenom: true, email: true },
    take: 500,
  });
  for (const c of candidats) {
    await envoyerMail({
      a: c.email!,
      sujet: `Nouvelle offre : ${o.titre} (${o.lieu})`,
      titre: `Bonjour ${c.prenom},`,
      lignes: [`Une nouvelle offre correspond à votre alerte « ${o.categorie} » :`, `${o.titre} — ${o.lieu} — ${o.contrat}${o.salaire ? ` — ${o.salaire}` : ""}`, "Vous recevez ce message car vous avez activé les alertes dans votre espace candidat. Vous pouvez les désactiver à tout moment."],
      lien: `/offres/${o.slug}?source=${encodeURIComponent("Site Franeo Jobs")}`,
      bouton: "Voir l'offre",
    });
  }
  return candidats.length;
}
