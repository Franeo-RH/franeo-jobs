"use server";
// Actions de l'espace client : retour sur un candidat, message à FRANEO RH, mot de passe.
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/session";
import { estSessionDemo } from "@/lib/demo";
import { journaliser } from "@/lib/registre";
import { notifierAdmin } from "@/lib/notifications";
import { txt, vers } from "./outils";

const nom = (s: { prenom: string; nom: string }) => `${s.prenom} ${s.nom}`.trim();

export async function donnerRetour(fd: FormData) {
  const s = await exigerClient();
  const id = txt(fd, "id");
  const statut = txt(fd, "statut");
  const retour = `/client/candidats/${id}`;
  if (!["RETENU", "REFUSE", "A_REVOIR"].includes(statut)) redirect(vers(retour, "Choisissez une réponse."));
  const motif = txt(fd, "motifRefus");
  if (statut === "REFUSE" && !motif) redirect(vers(retour, "Indiquez le motif du refus : cela nous aide à mieux cibler."));
  const p = await prisma.presentation.findFirst({ where: { id, entrepriseId: s.entrepriseId }, include: { candidat: true, mission: true } });
  if (!p) redirect("/client/candidats");
  await prisma.presentation.update({
    where: { id },
    data: { statut, motifRefus: statut === "REFUSE" ? motif : null, feedback: txt(fd, "feedback") || null, amelioration: txt(fd, "amelioration") || null, retourAt: new Date() },
  });
  const libelle = { RETENU: "Retenu", REFUSE: "Refusé", A_REVOIR: "À revoir" }[statut as "RETENU" | "REFUSE" | "A_REVOIR"];
  await journaliser({
    type: "REPONSE", detail: `${libelle}${statut === "REFUSE" ? ` — motif : ${motif}` : ""}${txt(fd, "feedback") ? ` — « ${txt(fd, "feedback")} »` : ""}`,
    acteur: nom(s), presentationId: id, candidatId: p!.candidatId, entrepriseId: s.entrepriseId,
  });
  if (statut === "RETENU") {
    const c = await prisma.candidature.findFirst({ where: { candidatId: p!.candidatId, missionId: p!.missionId } });
    if (c && c.etape === "PRESENTE") await prisma.candidature.update({ where: { id: c.id }, data: { etape: "ENTRETIEN_CLIENT" } });
  }
  if (statut === "REFUSE") {
    const c = await prisma.candidature.findFirst({ where: { candidatId: p!.candidatId, missionId: p!.missionId } });
    if (c) await prisma.candidature.update({ where: { id: c.id }, data: { etape: "REFUSE" } });
  }
  if (!estSessionDemo(s)) {
    await notifierAdmin({
      sujet: `${s.entreprise?.nom} : ${libelle} — ${p!.candidat.prenom} ${p!.candidat.nom}`, titre: `Retour client : ${libelle}`,
      lignes: [`${s.entreprise?.nom} · mission ${p!.mission.reference} (${p!.mission.poste})`, `Candidat : ${p!.candidat.prenom} ${p!.candidat.nom}`, ...(motif ? [`Motif : ${motif}`] : []), ...(txt(fd, "feedback") ? [`Commentaire : ${txt(fd, "feedback")}`] : [])],
      lien: "/admin/presentations",
    });
  }
  revalidatePath("/client/candidats");
  revalidatePath(retour);
  redirect(`${retour}?ok=1`);
}

export async function envoyerMessage(fd: FormData) {
  const s = await exigerClient();
  const message = txt(fd, "message");
  if (!message) redirect(vers("/client/echanges", "Écrivez votre message."));
  await journaliser({ type: "ECHANGE", detail: message.slice(0, 1500), acteur: nom(s), entrepriseId: s.entrepriseId });
  if (!estSessionDemo(s)) {
    await notifierAdmin({ sujet: `Message de ${s.entreprise?.nom}`, titre: "Nouveau message client", lignes: [`${nom(s)} (${s.entreprise?.nom}) :`, message], lien: "/admin/presentations/registre" });
  }
  revalidatePath("/client/echanges");
  redirect("/client/echanges?ok=Message envoyé à FRANEO RH ✅");
}

export async function changerMotDePasseClient(fd: FormData) {
  const s = await exigerClient();
  const u = await prisma.utilisateur.findUnique({ where: { id: s.id } });
  if (estSessionDemo(s)) redirect(vers("/client/profil", "Le mot de passe de la démo ne peut pas être modifié."));
  if (!u || !(await bcrypt.compare(txt(fd, "actuel"), u.motDePasse))) redirect(vers("/client/profil", "Mot de passe actuel incorrect."));
  if (txt(fd, "nouveau").length < 8) redirect(vers("/client/profil", "Le nouveau mot de passe doit faire 8 caractères minimum."));
  await prisma.utilisateur.update({ where: { id: s.id }, data: { motDePasse: await bcrypt.hash(txt(fd, "nouveau"), 10) } });
  redirect("/client/profil?ok=1");
}
