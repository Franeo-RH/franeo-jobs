"use server";
// Actions de l'espace candidat : mise à jour du profil, remplacement du CV, suppression des données.
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerCandidat } from "@/lib/session";
import { notifierAdmin } from "@/lib/notifications";
import { liste, nbr, txt, vers } from "./outils";
import { CATEGORIES } from "@/lib/constantes";
import { donneesCv, supprimerAncienCv } from "@/lib/stockage";

const TYPES_CV: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export async function majMonProfil(fd: FormData) {
  const s = await exigerCandidat();
  const prenom = txt(fd, "prenom");
  const nom = txt(fd, "nom");
  if (!prenom || !nom) redirect(vers("/candidat/profil", "Prénom et nom sont obligatoires."));
  const salaire = nbr(fd, "salaireSouhaite");
  await prisma.candidat.update({
    where: { id: s.candidatId },
    data: {
      prenom, nom, telephone: txt(fd, "telephone") || null, ville: txt(fd, "ville") || null, linkedin: txt(fd, "linkedin") || null,
      poste: txt(fd, "poste") || null, competences: liste(fd, "competences"), experience: txt(fd, "experience") || null,
      niveau: txt(fd, "niveau") || null, disponibilite: txt(fd, "disponibilite") || null, preavis: txt(fd, "preavis") || null,
      mobilite: txt(fd, "mobilite") || null, teletravail: txt(fd, "teletravail") || null,
      salaireSouhaite: salaire ? Math.round(salaire) : null, dernierContact: new Date(),
    },
  });
  await prisma.utilisateur.update({ where: { id: s.id }, data: { prenom, nom } });
  await prisma.note.create({ data: { candidatId: s.candidatId, type: "ECHANGE", texte: "Le candidat a mis à jour son profil depuis son espace.", auteur: `${prenom} ${nom}` } });
  revalidatePath("/candidat");
  redirect("/candidat/profil?ok=1");
}

export async function remplacerMonCv(fd: FormData) {
  const s = await exigerCandidat();
  const f = fd.get("cv");
  if (!(f instanceof File) || f.size === 0) redirect(vers("/candidat/profil", "Choisissez un fichier."));
  const fichier = f as File;
  if (fichier.size > 5 * 1024 * 1024) redirect(vers("/candidat/profil", "Le CV dépasse 5 Mo."));
  if (!TYPES_CV[fichier.type]) redirect(vers("/candidat/profil", "Le CV doit être un fichier PDF ou Word."));
  await supprimerAncienCv(s.candidatId);
  const champsCv = await donneesCv({ nom: fichier.name.slice(0, 150), type: fichier.type, data: new Uint8Array(await fichier.arrayBuffer()) });
  await prisma.candidat.update({
    where: { id: s.candidatId },
    data: { ...champsCv, dernierContact: new Date() },
  });
  await prisma.note.create({ data: { candidatId: s.candidatId, type: "DOCUMENT", texte: `Nouveau CV déposé par le candidat (${fichier.name}).`, auteur: `${s.prenom} ${s.nom}`.trim() } });
  redirect("/candidat/profil?ok=Votre nouveau CV est enregistré ✅");
}

export async function supprimerMonEspace() {
  const s = await exigerCandidat();
  const id = s.candidatId;
  await supprimerAncienCv(id);
  await prisma.candidat.update({
    where: { id },
    data: { prenom: "Anonymisé", nom: "RGPD", email: null, telephone: null, ville: null, linkedin: null, competences: [], cvNom: null, cvType: null, cvData: null, cvCle: null, statut: "NON_RETENU", poste: null, mobilite: null, salaireSouhaite: null },
  });
  await prisma.note.deleteMany({ where: { candidatId: id } });
  await prisma.relance.deleteMany({ where: { candidatId: id } });
  await prisma.note.create({ data: { candidatId: id, type: "NOTE_INTERNE", texte: "Le candidat a supprimé son espace et ses données (RGPD).", auteur: "Candidat" } });
  await prisma.utilisateur.delete({ where: { id: s.id } });
  await notifierAdmin({ sujet: "Suppression d'un espace candidat", titre: "Données candidat effacées", lignes: ["Un candidat a supprimé son espace : ses données personnelles ont été anonymisées."] });
  (await cookies()).set("userId", "", { httpOnly: true, path: "/", maxAge: 0 });
  redirect("/offres");
}

export async function majMesAlertes(fd: FormData) {
  const s = await exigerCandidat();
  const choix = fd.getAll("metiers").map(String).filter((m) => (CATEGORIES as readonly string[]).includes(m));
  await prisma.candidat.update({ where: { id: s.candidatId }, data: { alertesMetiers: choix } });
  redirect(`/candidat/profil?ok=${encodeURIComponent(choix.length ? "Alertes enregistrées ✅" : "Alertes désactivées")}`);
}

export async function retirerCandidature(fd: FormData) {
  const s = await exigerCandidat();
  const c = await prisma.candidature.findFirst({ where: { id: txt(fd, "id"), candidatId: s.candidatId }, include: { offre: { select: { titre: true } } } });
  if (!c || c.retireeAt || c.etape === "EMBAUCHE") redirect("/candidat");
  await prisma.candidature.update({ where: { id: c!.id }, data: { retireeAt: new Date() } });
  const quoi = c!.offre?.titre ?? "candidature spontanée";
  await prisma.note.create({ data: { candidatId: s.candidatId, type: "ECHANGE", texte: `Le candidat a retiré sa candidature (${quoi}).${txt(fd, "motif") ? ` Motif : ${txt(fd, "motif")}` : ""}`, auteur: `${s.prenom} ${s.nom}`.trim() } });
  await notifierAdmin({ sujet: `Candidature retirée — ${s.prenom} ${s.nom}`, titre: "Un candidat a retiré sa candidature", lignes: [`${s.prenom} ${s.nom} · ${quoi}`, ...(txt(fd, "motif") ? [`Motif : ${txt(fd, "motif")}`] : [])], lien: `/admin/candidats/${s.candidatId}` });
  revalidatePath("/candidat");
  redirect("/candidat?retiree=1");
}
