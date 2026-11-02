"use server";
// Actions de l'équipe FRANEO RH : clients, missions, offres, facturation, équipe, demandes, compte.
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerAdmin } from "@/lib/session";
import { slugifier } from "@/lib/constantes";
import { envoyerAlertesOffre } from "@/lib/alertes";
import { liste, nbr, txt, vers } from "./outils";

// ───────── Clients ─────────
export async function creerClient(fd: FormData) {
  await exigerAdmin();
  const nom = txt(fd, "nom");
  if (!nom) redirect(vers("/admin/clients/nouveau", "Le nom de l'entreprise est obligatoire."));
  const e = await prisma.entreprise.create({
    data: {
      nom, secteur: txt(fd, "secteur") || null, contactNom: txt(fd, "contactNom") || null, contactPoste: txt(fd, "contactPoste") || null,
      email: txt(fd, "email") || null, telephone: txt(fd, "telephone") || null, rue: txt(fd, "rue") || null, codePostal: txt(fd, "codePostal") || null,
      ville: txt(fd, "ville") || null, siteWeb: txt(fd, "siteWeb") || null, siret: txt(fd, "siret") || null,
      tauxHonoraires: nbr(fd, "tauxHonoraires") ?? 20, garantieMois: Math.round(nbr(fd, "garantieMois") ?? 3), notes: txt(fd, "notes") || null,
    },
  });
  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${e.id}`);
}

export async function majClient(fd: FormData) {
  await exigerAdmin();
  const id = txt(fd, "id");
  await prisma.entreprise.update({
    where: { id },
    data: {
      nom: txt(fd, "nom"), secteur: txt(fd, "secteur") || null, contactNom: txt(fd, "contactNom") || null, contactPoste: txt(fd, "contactPoste") || null,
      email: txt(fd, "email") || null, telephone: txt(fd, "telephone") || null, ville: txt(fd, "ville") || null, siret: txt(fd, "siret") || null,
      tauxHonoraires: nbr(fd, "tauxHonoraires") ?? 20, garantieMois: Math.round(nbr(fd, "garantieMois") ?? 3), notes: txt(fd, "notes") || null,
    },
  });
  revalidatePath(`/admin/clients/${id}`);
  redirect(`/admin/clients/${id}`);
}

export async function basculerClient(fd: FormData) {
  await exigerAdmin();
  const id = txt(fd, "id");
  const e = await prisma.entreprise.findUnique({ where: { id } });
  if (!e) return;
  await prisma.entreprise.update({ where: { id }, data: { actif: !e.actif } });
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/clients");
}

export async function creerAccesClient(fd: FormData) {
  await exigerAdmin();
  const entrepriseId = txt(fd, "entrepriseId");
  const email = txt(fd, "email").toLowerCase();
  const mdp = txt(fd, "motDePasse");
  const retour = `/admin/clients/${entrepriseId}`;
  if (!email || mdp.length < 8) redirect(vers(retour, "E-mail et mot de passe (8 caractères minimum) obligatoires."));
  if (await prisma.utilisateur.findUnique({ where: { email } })) redirect(vers(retour, "Cet e-mail a déjà un compte."));
  await prisma.utilisateur.create({
    data: { email, prenom: txt(fd, "prenom") || "Contact", nom: txt(fd, "nom"), role: "CLIENT", entrepriseId, motDePasse: await bcrypt.hash(mdp, 10) },
  });
  revalidatePath(retour);
  redirect(retour);
}

export async function basculerAcces(fd: FormData) {
  await exigerAdmin();
  const u = await prisma.utilisateur.findUnique({ where: { id: txt(fd, "id") } });
  if (!u) return;
  await prisma.utilisateur.update({ where: { id: u.id }, data: { actif: !u.actif } });
  revalidatePath("/admin/clients");
  if (u.entrepriseId) revalidatePath(`/admin/clients/${u.entrepriseId}`);
  revalidatePath("/admin/parametres/equipe");
}

// ───────── Missions ─────────
export async function creerMission(fd: FormData) {
  await exigerAdmin();
  const entrepriseId = txt(fd, "entrepriseId");
  const poste = txt(fd, "poste");
  const lieu = txt(fd, "lieu");
  if (!entrepriseId || !poste || !lieu) redirect(vers("/admin/missions/nouveau", "Client, poste et lieu sont obligatoires."));
  const annee = new Date().getFullYear();
  const n = (await prisma.mission.count({ where: { reference: { startsWith: `M-${annee}-` } } })) + 1;
  const m = await prisma.mission.create({
    data: {
      reference: `M-${annee}-${String(n).padStart(3, "0")}`, entrepriseId, poste, lieu, categorie: txt(fd, "categorie") || "Autres",
      nbPostes: Math.max(1, Math.round(nbr(fd, "nbPostes") ?? 1)), contrat: txt(fd, "contrat") || "CDI",
      salaireMin: nbr(fd, "salaireMin"), salaireMax: nbr(fd, "salaireMax"), competences: liste(fd, "competences"),
      description: txt(fd, "description") || null, consultant: txt(fd, "consultant") || null, statut: txt(fd, "statut") || "OUVERTE",
    },
  });
  revalidatePath("/admin/missions");
  redirect(`/admin/missions/${m.id}`);
}

export async function majMission(fd: FormData) {
  await exigerAdmin();
  const id = txt(fd, "id");
  const statut = txt(fd, "statut");
  await prisma.mission.update({
    where: { id },
    data: {
      statut, consultant: txt(fd, "consultant") || null,
      dateCloture: statut === "POURVUE" || statut === "CLOTUREE" ? new Date() : null,
    },
  });
  revalidatePath(`/admin/missions/${id}`);
  revalidatePath("/admin/missions");
  redirect(`/admin/missions/${id}`);
}

// ───────── Offres ─────────
async function slugUnique(titre: string, ignorerId?: string) {
  const base = slugifier(titre) || "offre";
  let slug = base;
  for (let i = 2; ; i++) {
    const existe = await prisma.offre.findUnique({ where: { slug } });
    if (!existe || existe.id === ignorerId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function creerOffre(fd: FormData) {
  await exigerAdmin();
  const titre = txt(fd, "titre");
  const lieu = txt(fd, "lieu");
  const description = txt(fd, "description");
  if (!titre || !lieu || !description) redirect(vers("/admin/offres/nouveau", "Titre, lieu et description sont obligatoires."));
  const publier = txt(fd, "action") === "publier";
  const o = await prisma.offre.create({
    data: {
      slug: await slugUnique(titre), titre, lieu, description, missionId: txt(fd, "missionId") || null, categorie: txt(fd, "categorie") || "Autres",
      contrat: txt(fd, "contrat") || "CDI", salaire: txt(fd, "salaire") || null, taches: txt(fd, "taches") || null, profil: txt(fd, "profil") || null,
      competences: liste(fd, "competences"), avantages: txt(fd, "avantages") || null, questionnaire: txt(fd, "questionnaire") || "auto", seuilTest: Math.max(0, Math.min(100, Math.round(nbr(fd, "seuilTest") ?? 0))),
      diffusion: fd.getAll("diffusion").map(String), statut: publier ? "PUBLIEE" : "BROUILLON", publieeAt: publier ? new Date() : null,
    },
  });
  if (publier) await envoyerAlertesOffre(o.id);
  revalidatePath("/admin/offres");
  revalidatePath("/offres");
  redirect(`/admin/offres/${o.id}`);
}

export async function majOffre(fd: FormData) {
  await exigerAdmin();
  const id = txt(fd, "id");
  await prisma.offre.update({
    where: { id },
    data: {
      titre: txt(fd, "titre"), lieu: txt(fd, "lieu"), description: txt(fd, "description"), categorie: txt(fd, "categorie") || "Autres",
      contrat: txt(fd, "contrat") || "CDI", salaire: txt(fd, "salaire") || null, taches: txt(fd, "taches") || null, profil: txt(fd, "profil") || null,
      competences: liste(fd, "competences"), avantages: txt(fd, "avantages") || null, questionnaire: txt(fd, "questionnaire") || "auto",
      seuilTest: Math.max(0, Math.min(100, Math.round(nbr(fd, "seuilTest") ?? 0))), diffusion: fd.getAll("diffusion").map(String),
    },
  });
  revalidatePath(`/admin/offres/${id}`);
  revalidatePath("/offres");
  redirect(`/admin/offres/${id}`);
}

export async function statutOffre(fd: FormData) {
  await exigerAdmin();
  const id = txt(fd, "id");
  const statut = txt(fd, "statut");
  const o = await prisma.offre.findUnique({ where: { id } });
  if (!o) return;
  await prisma.offre.update({ where: { id }, data: { statut, publieeAt: statut === "PUBLIEE" && !o.publieeAt ? new Date() : o.publieeAt } });
  if (statut === "PUBLIEE" && !o.publieeAt) await envoyerAlertesOffre(id); // première publication seulement
  revalidatePath("/admin/offres");
  revalidatePath(`/admin/offres/${id}`);
  revalidatePath("/offres");
  revalidatePath(`/offres/${o.slug}`);
}

// ───────── Facturation ─────────
export async function statutFacture(fd: FormData) {
  await exigerAdmin();
  await prisma.facture.update({ where: { id: txt(fd, "id") }, data: { statut: txt(fd, "statut") } });
  revalidatePath("/admin/facturation");
}

// ───────── Équipe, demandes, compte ─────────
export async function creerAdmin(fd: FormData) {
  await exigerAdmin();
  const email = txt(fd, "email").toLowerCase();
  const mdp = txt(fd, "motDePasse");
  if (!email || mdp.length < 8) redirect(vers("/admin/parametres/equipe", "E-mail et mot de passe (8 caractères minimum) obligatoires."));
  if (await prisma.utilisateur.findUnique({ where: { email } })) redirect(vers("/admin/parametres/equipe", "Cet e-mail a déjà un compte."));
  await prisma.utilisateur.create({ data: { email, prenom: txt(fd, "prenom") || "Consultant", nom: txt(fd, "nom"), role: "ADMIN", motDePasse: await bcrypt.hash(mdp, 10) } });
  revalidatePath("/admin/parametres/equipe");
  redirect("/admin/parametres/equipe");
}

export async function traiterDemande(fd: FormData) {
  await exigerAdmin();
  await prisma.demandeInscription.update({ where: { id: txt(fd, "id") }, data: { statut: "TRAITEE", traiteeAt: new Date() } });
  revalidatePath("/admin/parametres/demandes");
}

export async function changerMonMotDePasse(fd: FormData) {
  const s = await exigerAdmin();
  const actuel = txt(fd, "actuel");
  const nouveau = txt(fd, "nouveau");
  const u = await prisma.utilisateur.findUnique({ where: { id: s.id } });
  if (!u || !(await bcrypt.compare(actuel, u.motDePasse))) redirect(vers("/admin/parametres", "Mot de passe actuel incorrect."));
  if (nouveau.length < 8) redirect(vers("/admin/parametres", "Le nouveau mot de passe doit faire 8 caractères minimum."));
  await prisma.utilisateur.update({ where: { id: s.id }, data: { motDePasse: await bcrypt.hash(nouveau, 10) } });
  redirect("/admin/parametres?ok=1");
}

// ───────── Stockage des CV (Cloudflare R2) ─────────
export async function verifierR2() {
  await exigerAdmin();
  const { testerR2 } = await import("@/lib/stockage");
  const r = await testerR2();
  redirect(r === "OK" ? "/admin/parametres/stockage?ok=Connexion à Cloudflare R2 réussie ✅" : vers("/admin/parametres/stockage", r));
}

export async function migrerCvVersR2() {
  await exigerAdmin();
  const { migrerVersR2 } = await import("@/lib/stockage");
  const { deplaces, restants } = await migrerVersR2();
  revalidatePath("/admin/parametres/stockage");
  redirect(`/admin/parametres/stockage?ok=${encodeURIComponent(`${deplaces} CV déplacé(s) vers R2. ${restants ? `Il en reste ${restants} : relancez.` : "Terminé ✅"}`)}`);
}
