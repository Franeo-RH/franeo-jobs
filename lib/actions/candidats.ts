"use server";
// Actions de l'équipe FRANEO RH : CVthèque, pipeline, présentations, relances, RGPD.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerAdmin } from "@/lib/session";
import { journaliser, presentationAnterieure } from "@/lib/registre";
import { APP_URL, envoyerMail } from "@/lib/notifications";
import { envoyerRelance, planifierRelances } from "@/lib/relances";
import { liste, nbr, txt, vers } from "./outils";
import { supprimerAncienCv } from "@/lib/stockage";

const nomAdmin = (s: { prenom: string; nom: string }) => `${s.prenom} ${s.nom}`.trim();

// ───────── CVthèque ─────────
export async function creerCandidat(fd: FormData) {
  const s = await exigerAdmin();
  const prenom = txt(fd, "prenom");
  const nom = txt(fd, "nom");
  const email = txt(fd, "email").toLowerCase() || null;
  if (!prenom || !nom) redirect(vers("/admin/candidats/nouveau", "Prénom et nom sont obligatoires."));
  if (email) {
    const existant = await prisma.candidat.findUnique({ where: { email } });
    if (existant) redirect(`/admin/candidats/${existant.id}`);
  }
  const c = await prisma.candidat.create({
    data: {
      prenom, nom, email, telephone: txt(fd, "telephone") || null, ville: txt(fd, "ville") || null, linkedin: txt(fd, "linkedin") || null,
      metier: txt(fd, "metier") || "Autres", poste: txt(fd, "poste") || null, competences: liste(fd, "competences"), experience: txt(fd, "experience") || null,
      niveau: txt(fd, "niveau") || null, disponibilite: txt(fd, "disponibilite") || null, mobilite: txt(fd, "mobilite") || null,
      teletravail: txt(fd, "teletravail") || null, salaireSouhaite: nbr(fd, "salaireSouhaite") ? Math.round(nbr(fd, "salaireSouhaite")!) : null,
      source: txt(fd, "source") || "Import manuel", consentementAt: txt(fd, "consentement") ? new Date() : null,
    },
  });
  await prisma.note.create({ data: { candidatId: c.id, type: "NOTE_INTERNE", texte: "Candidat ajouté manuellement.", auteur: nomAdmin(s) } });
  if (email) await planifierRelances(c.id);
  revalidatePath("/admin/candidats");
  redirect(`/admin/candidats/${c.id}`);
}

export async function majCandidat(fd: FormData) {
  const s = await exigerAdmin();
  const id = txt(fd, "id");
  const statut = txt(fd, "statut");
  const avant = await prisma.candidat.findUnique({ where: { id } });
  if (!avant) return;
  await prisma.candidat.update({
    where: { id },
    data: {
      statut, metier: txt(fd, "metier") || avant.metier, poste: txt(fd, "poste") || null,
      competences: liste(fd, "competences"), disponibilite: txt(fd, "disponibilite") || null,
      salaireSouhaite: nbr(fd, "salaireSouhaite") ? Math.round(nbr(fd, "salaireSouhaite")!) : null,
      dernierContact: new Date(),
    },
  });
  if (avant.statut !== statut) {
    await prisma.note.create({ data: { candidatId: id, type: "NOTE_INTERNE", texte: `Statut : ${avant.statut} → ${statut}`, auteur: nomAdmin(s) } });
  }
  revalidatePath(`/admin/candidats/${id}`);
  revalidatePath("/admin/candidats");
  redirect(`/admin/candidats/${id}`);
}

export async function ajouterNote(fd: FormData) {
  const s = await exigerAdmin();
  const candidatId = txt(fd, "candidatId");
  const texte = txt(fd, "texte");
  if (!texte) return;
  await prisma.note.create({ data: { candidatId, texte, type: txt(fd, "type") || "COMMENTAIRE", auteur: nomAdmin(s) } });
  await prisma.candidat.update({ where: { id: candidatId }, data: { dernierContact: new Date() } });
  revalidatePath(`/admin/candidats/${candidatId}`);
}

export async function ajouterEntretien(fd: FormData) {
  const s = await exigerAdmin();
  const candidatId = txt(fd, "candidatId");
  const note = (k: string) => Math.max(0, Math.min(5, Math.round(nbr(fd, k) ?? 0)));
  const [competences, experience, motivation, communication, adequation] = ["competences", "experience", "motivation", "communication", "adequation"].map(note);
  const score = Math.round(((competences + experience + motivation + communication + adequation) / 25) * 100);
  await prisma.entretien.create({
    data: {
      candidatId, consultant: nomAdmin(s), dureeMin: nbr(fd, "dureeMin") ? Math.round(nbr(fd, "dureeMin")!) : null,
      commentaires: txt(fd, "commentaires") || null, competences, experience, motivation, communication, adequation, score,
    },
  });
  const c = await prisma.candidat.findUnique({ where: { id: candidatId } });
  if (c && ["NOUVEAU", "A_CONTACTER"].includes(c.statut)) await prisma.candidat.update({ where: { id: candidatId }, data: { statut: "ENTRETIEN_REALISE", dernierContact: new Date() } });
  await prisma.note.create({ data: { candidatId, type: "NOTE_INTERNE", texte: `Entretien FRANEO réalisé — grille ${score}/100.`, auteur: nomAdmin(s) } });
  revalidatePath(`/admin/candidats/${candidatId}`);
}

export async function anonymiserCandidat(fd: FormData) {
  const s = await exigerAdmin();
  const id = txt(fd, "id");
  await supprimerAncienCv(id);
  await prisma.candidat.update({
    where: { id },
    data: {
      prenom: "Anonymisé", nom: "RGPD", email: null, telephone: null, ville: null, linkedin: null, competences: [], cvNom: null, cvType: null, cvData: null, cvCle: null,
      statut: "NON_RETENU", poste: null, mobilite: null, salaireSouhaite: null,
    },
  });
  await prisma.note.deleteMany({ where: { candidatId: id } });
  await prisma.relance.deleteMany({ where: { candidatId: id } });
  await prisma.utilisateur.deleteMany({ where: { candidatId: id } });
  await prisma.note.create({ data: { candidatId: id, type: "NOTE_INTERNE", texte: "Données personnelles effacées (RGPD).", auteur: nomAdmin(s) } });
  revalidatePath("/admin/candidats");
  redirect("/admin/candidats");
}

// ───────── Pipeline ─────────
export async function deplacerEtape(fd: FormData) {
  const s = await exigerAdmin();
  const id = txt(fd, "id");
  const etape = txt(fd, "etape");
  const c = await prisma.candidature.update({ where: { id }, data: { etape } });
  const carte: Record<string, string> = { PRESENTABLE: "PRESENTABLE", ENTRETIEN_FRANEO: "ENTRETIEN_REALISE", PREQUALIFICATION: "A_CONTACTER", REFUSE: "NON_RETENU" };
  if (carte[etape]) await prisma.candidat.update({ where: { id: c.candidatId }, data: { statut: carte[etape], dernierContact: new Date() } });
  await prisma.note.create({ data: { candidatId: c.candidatId, type: "NOTE_INTERNE", texte: `Pipeline : étape « ${etape} »`, auteur: nomAdmin(s) } });
  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/candidats/${c.candidatId}`);
}

export async function marquerEmbauche(fd: FormData) {
  const s = await exigerAdmin();
  const id = txt(fd, "id");
  const salaire = Math.round(nbr(fd, "salaire") ?? 0);
  const cand = await prisma.candidature.findUnique({ where: { id }, include: { mission: { include: { entreprise: true } } } });
  if (!cand || !cand.mission) redirect(vers("/admin/pipeline", "Cette candidature n'est liée à aucune mission."));
  if (salaire <= 0) redirect(vers("/admin/pipeline", "Indiquez le salaire annuel brut pour calculer les honoraires."));
  const m = cand.mission!;
  const date = new Date();
  const fin = new Date(date);
  fin.setMonth(fin.getMonth() + m.entreprise.garantieMois);
  await prisma.$transaction([
    prisma.candidature.update({ where: { id }, data: { etape: "EMBAUCHE" } }),
    prisma.candidat.update({ where: { id: cand.candidatId }, data: { statut: "RECRUTE" } }),
    prisma.facture.create({
      data: {
        missionId: m.id, candidatId: cand.candidatId, entrepriseId: m.entrepriseId, salaireAnnuel: salaire, taux: m.entreprise.tauxHonoraires,
        honoraires: Math.round((salaire * m.entreprise.tauxHonoraires) / 100), dateEmbauche: date, finGarantie: fin,
      },
    }),
    prisma.note.create({ data: { candidatId: cand.candidatId, type: "NOTE_INTERNE", texte: `Embauché sur la mission ${m.reference} (${salaire} € brut/an).`, auteur: nomAdmin(s) } }),
  ]);
  const embauches = await prisma.candidature.count({ where: { missionId: m.id, etape: "EMBAUCHE" } });
  if (embauches >= m.nbPostes) await prisma.mission.update({ where: { id: m.id }, data: { statut: "POURVUE", dateCloture: new Date() } });
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/facturation");
  redirect("/admin/facturation");
}

export async function ajouterAuPipeline(fd: FormData) {
  const s = await exigerAdmin();
  const candidatId = txt(fd, "candidatId");
  const missionId = txt(fd, "missionId");
  if (!candidatId || !missionId) return;
  const existe = await prisma.candidature.findFirst({ where: { candidatId, missionId } });
  if (!existe) {
    await prisma.candidature.create({ data: { candidatId, missionId, source: "Matching", etape: "PREQUALIFICATION" } });
    await prisma.note.create({ data: { candidatId, type: "NOTE_INTERNE", texte: "Ajouté au pipeline d'une mission.", auteur: nomAdmin(s) } });
  }
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/matching");
}

// ───────── Présentations (avec contrôle anti-doublon) ─────────
export async function presenterCandidat(fd: FormData) {
  const s = await exigerAdmin();
  const candidatId = txt(fd, "candidatId");
  const missionId = txt(fd, "missionId");
  const retour = `/admin/presentations/nouvelle?candidatId=${candidatId}&missionId=${missionId}`;
  const mission = await prisma.mission.findUnique({ where: { id: missionId }, include: { entreprise: { include: { utilisateurs: { where: { actif: true } } } } } });
  const candidat = await prisma.candidat.findUnique({ where: { id: candidatId } });
  if (!mission || !candidat) redirect(vers("/admin/presentations/nouvelle", "Choisissez un candidat et une mission."));
  const e = mission!.entreprise;
  const anterieure = await presentationAnterieure(candidatId, e.id);
  const forcer = txt(fd, "forcer") === "oui";
  const motif = txt(fd, "motifDoublon");
  if (anterieure && !forcer) redirect(vers(retour + "&doublon=1"));
  if (anterieure && forcer && !motif) redirect(vers(retour + "&doublon=1", "Indiquez le motif de la nouvelle présentation."));

  const destinataires = liste(fd, "destinataires");
  const emails = destinataires.length ? destinataires : e.utilisateurs.map((u) => u.email);
  const p = await prisma.presentation.create({
    data: {
      candidatId, missionId, entrepriseId: e.id, consultant: nomAdmin(s), destinataires: emails,
      avis: txt(fd, "avis") || null, synthese: txt(fd, "synthese") || null,
    },
  });
  await journaliser({
    type: "ENVOI", detail: `Dossier de ${candidat!.prenom} ${candidat!.nom} envoyé pour la mission ${mission!.reference} (${mission!.poste}) à ${emails.join(", ") || "aucun destinataire"}`,
    acteur: nomAdmin(s), presentationId: p.id, candidatId, entrepriseId: e.id,
  });
  if (anterieure) {
    await journaliser({
      type: "DOUBLON_FORCE", detail: `Candidat déjà présenté le ${anterieure.envoyeAt.toLocaleDateString("fr-FR")} (mission ${anterieure.mission.reference}). Motif : ${motif}`,
      acteur: nomAdmin(s), presentationId: p.id, candidatId, entrepriseId: e.id,
    });
  }
  // Pipeline et statut du candidat
  const cand = await prisma.candidature.findFirst({ where: { candidatId, missionId } });
  if (cand) await prisma.candidature.update({ where: { id: cand.id }, data: { etape: "PRESENTE" } });
  else await prisma.candidature.create({ data: { candidatId, missionId, etape: "PRESENTE", source: "Présentation directe" } });
  await prisma.candidat.update({ where: { id: candidatId }, data: { statut: "PRESENTABLE", dernierContact: new Date() } });
  if (mission!.statut === "OUVERTE" || mission!.statut === "EN_SOURCING") await prisma.mission.update({ where: { id: missionId }, data: { statut: "EN_PRESENTATION" } });
  await prisma.note.create({ data: { candidatId, type: "NOTE_INTERNE", texte: `Présenté à ${e.nom} (mission ${mission!.reference}).`, auteur: nomAdmin(s) } });

  if (emails.length) {
    await envoyerMail({
      a: emails, sujet: `Nouveau candidat pour « ${mission!.poste} »`, titre: "Un candidat vous est présenté",
      lignes: [`${candidat!.prenom} ${candidat!.nom.charAt(0)}. — ${candidat!.poste || candidat!.metier}`, p.avis ? `Avis du consultant : ${p.avis}` : "Retrouvez son dossier complet, son CV et donnez votre retour en un clic."],
      lien: `/client/candidats/${p.id}`, bouton: "Consulter le dossier", pixelSuivi: `${APP_URL}/api/suivi/${p.id}`,
    });
  }
  revalidatePath("/admin/presentations");
  redirect("/admin/presentations?ok=1");
}

// ───────── Relances ─────────
export async function reglerRelance(fd: FormData) {
  await exigerAdmin();
  const regle = txt(fd, "regle");
  const actuel = txt(fd, "actif") === "1";
  await prisma.parametre.upsert({ where: { cle: `relance_${regle}` }, create: { cle: `relance_${regle}`, valeur: actuel ? "0" : "1" }, update: { valeur: actuel ? "0" : "1" } });
  revalidatePath("/admin/relances");
}

export async function relancerMaintenant(fd: FormData) {
  await exigerAdmin();
  await envoyerRelance(txt(fd, "id"));
  revalidatePath("/admin/relances");
}

// ───────── RGPD : effacement en lot des profils sans contact depuis 24 mois ─────────
export async function anonymiserAnciens() {
  const s = await exigerAdmin();
  const limite = new Date();
  limite.setMonth(limite.getMonth() - 24);
  const anciens = await prisma.candidat.findMany({ where: { demo: false, dernierContact: { lt: limite }, NOT: { nom: "RGPD" } }, select: { id: true } });
  for (const { id } of anciens) {
    await supprimerAncienCv(id);
    await prisma.candidat.update({
      where: { id },
      data: { prenom: "Anonymisé", nom: "RGPD", email: null, telephone: null, ville: null, linkedin: null, competences: [], cvNom: null, cvType: null, cvData: null, cvCle: null, statut: "NON_RETENU", poste: null, mobilite: null, salaireSouhaite: null },
    });
    await prisma.note.deleteMany({ where: { candidatId: id } });
    await prisma.relance.deleteMany({ where: { candidatId: id } });
  await prisma.utilisateur.deleteMany({ where: { candidatId: id } });
    await prisma.note.create({ data: { candidatId: id, type: "NOTE_INTERNE", texte: `Effacement automatique après 24 mois sans contact (lancé par ${nomAdmin(s)}).`, auteur: nomAdmin(s) } });
  }
  revalidatePath("/admin/parametres/rgpd");
  redirect(`/admin/parametres/rgpd?ok=${anciens.length} profil(s) anonymisé(s)`);
}

// ───────── Questionnaire : note du consultant sur la réponse libre ─────────
export async function noterReponseLibre(fd: FormData) {
  const s = await exigerAdmin();
  const id = txt(fd, "id");
  const note = Math.max(0, Math.min(5, Math.round(nbr(fd, "note") ?? 0)));
  const c = await prisma.candidature.update({ where: { id }, data: { noteLibre: note, commentaireTest: txt(fd, "commentaire") || null, aRelire: false } });
  const { scoreAjuste } = await import("@/lib/questionnaires");
  const final = scoreAjuste(c.scoreTest, note);
  if (final != null) await prisma.candidat.update({ where: { id: c.candidatId }, data: { scoreTest: final } });
  await prisma.note.create({ data: { candidatId: c.candidatId, type: "NOTE_INTERNE", texte: `Réponse libre notée ${note}/5 — score final ${final}/100.`, auteur: nomAdmin(s) } });
  revalidatePath(`/admin/candidats/${c.candidatId}`);
}
