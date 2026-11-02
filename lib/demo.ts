// lib/demo.ts
// Entreprise de démonstration partagée : création, remise à zéro, repérage.
// Tout est fictif. Les données de démo sont exclues des statistiques et des exports de l'équipe FRANEO RH.
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const EMAIL_DEMO = "demo@jobs.franeo-rh.com";
export const NOM_DEMO = "Entreprise Démo";

export function estSessionDemo(session: { entreprise?: { demo?: boolean } | null } | null | undefined): boolean {
  return !!session?.entreprise?.demo;
}

const JOUR = 86400000;
const il = (jours: number) => new Date(Date.now() - jours * JOUR);

/** Efface toutes les données de démo (sans toucher aux vraies données) */
async function viderDemo() {
  const ent = await prisma.entreprise.findFirst({ where: { demo: true } });
  if (ent) {
    await prisma.journalRegistre.deleteMany({ where: { entrepriseId: ent.id } });
    await prisma.presentation.deleteMany({ where: { entrepriseId: ent.id } });
    await prisma.facture.deleteMany({ where: { entrepriseId: ent.id } });
    const missions = await prisma.mission.findMany({ where: { entrepriseId: ent.id }, select: { id: true } });
    await prisma.offre.deleteMany({ where: { missionId: { in: missions.map((m) => m.id) } } });
    await prisma.candidature.deleteMany({ where: { missionId: { in: missions.map((m) => m.id) } } });
    await prisma.mission.deleteMany({ where: { entrepriseId: ent.id } });
  }
  await prisma.candidat.deleteMany({ where: { demo: true } });
}

async function remplirDemo(entrepriseId: string) {
  const missions = await Promise.all([
    prisma.mission.create({ data: { reference: "DEMO-001", entrepriseId, poste: "Commercial B2B H/F", categorie: "Commercial", contrat: "CDI", lieu: "Lyon", salaireMin: 38000, salaireMax: 45000, competences: ["Négociation", "CRM", "B2B"], statut: "EN_PRESENTATION", consultant: "Camille R.", createdAt: il(25) } }),
    prisma.mission.create({ data: { reference: "DEMO-002", entrepriseId, poste: "Gestionnaire de paie H/F", categorie: "Paie", contrat: "CDI", lieu: "Lyon", salaireMin: 34000, salaireMax: 40000, competences: ["Paie", "DSN", "Silae"], statut: "EN_PRESENTATION", consultant: "Camille R.", createdAt: il(12) } }),
    prisma.mission.create({ data: { reference: "DEMO-003", entrepriseId, poste: "Assistant(e) administratif(ve) H/F", categorie: "Administratif", contrat: "CDD 6 mois", lieu: "Villeurbanne", salaireMin: 26000, salaireMax: 29000, competences: ["Accueil", "Word/Excel"], statut: "OUVERTE", consultant: "Yanis B.", createdAt: il(4) } }),
  ]);
  const [mCom, mPaie] = missions;

  const dossiers = [
    { prenom: "Léa", nom: "Marchand", email: "lea.marchand@exemple.test", ville: "Lyon", metier: "Commercial", poste: "Commercial B2B", comp: ["Négociation", "CRM", "B2B"], exp: "6 ans", niveau: "Bac+3", dispo: "Immédiate", sal: 42000, score: 84, mission: mCom.id, statut: "PRESENTABLE" },
    { prenom: "Hugo", nom: "Perrin", email: "hugo.perrin@exemple.test", ville: "Villeurbanne", metier: "Commercial", poste: "Commercial terrain", comp: ["Prospection", "Salesforce"], exp: "4 ans", niveau: "Bac+2", dispo: "1 mois", sal: 40000, score: 78, mission: mCom.id, statut: "PRESENTABLE" },
    { prenom: "Nora", nom: "Haddad", email: "nora.haddad@exemple.test", ville: "Lyon", metier: "Commercial", poste: "Responsable grands comptes", comp: ["Grands comptes", "Négociation"], exp: "10 ans", niveau: "Bac+5", dispo: "Immédiate", sal: 45000, score: 91, mission: mCom.id, statut: "PRESENTABLE" },
    { prenom: "Emma", nom: "Giraud", email: "emma.giraud@exemple.test", ville: "Lyon", metier: "Paie", poste: "Gestionnaire de paie senior", comp: ["Paie", "Silae", "DSN"], exp: "7 ans", niveau: "Bac+3", dispo: "2 mois", sal: 38000, score: 88, mission: mPaie.id, statut: "PRESENTABLE" },
    { prenom: "Thomas", nom: "Weber", email: "thomas.weber@exemple.test", ville: "Bron", metier: "Paie", poste: "Gestionnaire de paie", comp: ["Paie", "Sage", "DSN"], exp: "3 ans", niveau: "Bac+2", dispo: "1 mois", sal: 34000, score: 72, mission: mPaie.id, statut: "PRESENTABLE" },
  ];
  const ids: string[] = [];
  for (const d of dossiers) {
    const c = await prisma.candidat.create({
      data: { prenom: d.prenom, nom: d.nom, email: d.email, ville: d.ville, metier: d.metier, poste: d.poste, competences: d.comp, experience: d.exp, niveau: d.niveau, disponibilite: d.dispo, salaireSouhaite: d.sal, mobilite: "Région lyonnaise", teletravail: "Partiel", preavis: "1 mois", statut: d.statut, source: "LinkedIn", scoreTest: d.score, demo: true, consentementAt: new Date() },
    });
    ids.push(c.id);
    await prisma.candidature.create({ data: { candidatId: c.id, missionId: d.mission, etape: "PRESENTE", scoreTest: d.score, source: "LinkedIn" } });
    await prisma.entretien.create({ data: { candidatId: c.id, consultant: "Camille R.", dureeMin: 45, commentaires: "Entretien de qualification : profil solide, motivé, disponible.", competences: d.score + 3, experience: d.score - 4, motivation: d.score + 5, communication: d.score, adequation: d.score + 1, score: d.score } });
    await prisma.note.create({ data: { candidatId: c.id, type: "NOTE_INTERNE", texte: "Dossier de démonstration (données fictives).", auteur: "Camille R." } });
  }

  // Trois présentations déjà envoyées, avec leur historique dans le registre
  const demoClient = await prisma.utilisateur.findUnique({ where: { email: EMAIL_DEMO } });
  const acteurClient = demoClient ? `${demoClient.prenom} ${demoClient.nom}`.trim() : "Client démo";
  const presentations = [
    { i: 0, m: mCom.id, statut: "RETENU", jours: 8, feedback: "Excellent contact, nous la rencontrons mardi." },
    { i: 1, m: mCom.id, statut: "EN_ATTENTE", jours: 2, feedback: null },
    { i: 3, m: mPaie.id, statut: "A_REVOIR", jours: 5, feedback: "Profil intéressant, à revoir après les entretiens en cours." },
  ];
  for (const p of presentations) {
    const c = dossiers[p.i];
    const envoi = il(p.jours);
    const pres = await prisma.presentation.create({
      data: {
        candidatId: ids[p.i], missionId: p.m, entrepriseId, consultant: "Camille R.", destinataires: [EMAIL_DEMO],
        avis: `${c.prenom} a un profil très cohérent avec le poste. Disponible rapidement.`, synthese: "Entretien FRANEO de 45 minutes : compétences confirmées, motivation forte.",
        statut: p.statut, feedback: p.feedback, envoyeAt: envoi,
        ouvertAt: new Date(envoi.getTime() + 40 * 60000), consulteAt: new Date(envoi.getTime() + 55 * 60000),
        cvTelechargeAt: p.statut !== "EN_ATTENTE" ? new Date(envoi.getTime() + 70 * 60000) : null,
        retourAt: p.statut !== "EN_ATTENTE" ? new Date(envoi.getTime() + 3 * 3600000) : null,
      },
    });
    const ligne = (type: "ENVOI" | "OUVERTURE" | "CONSULTATION" | "TELECHARGEMENT_CV" | "REPONSE", detail: string, acteur: string, delai: number) =>
      prisma.journalRegistre.create({ data: { type, detail, acteur, presentationId: pres.id, candidatId: ids[p.i], entrepriseId, createdAt: new Date(envoi.getTime() + delai * 60000) } });
    await ligne("ENVOI", `Dossier envoyé à ${EMAIL_DEMO}`, "Camille R.", 0);
    await ligne("OUVERTURE", "E-mail de présentation ouvert", "Destinataire", 40);
    await ligne("CONSULTATION", "Dossier consulté sur l'espace client", acteurClient, 55);
    if (p.statut !== "EN_ATTENTE") {
      await ligne("TELECHARGEMENT_CV", `CV de ${c.prenom} ${c.nom} téléchargé`, acteurClient, 70);
      await ligne("REPONSE", `Retour du client : ${p.statut === "RETENU" ? "Retenu" : "À revoir"}`, acteurClient, 180);
    }
  }
}

/** Crée l'entreprise et l'utilisateur démo s'ils n'existent pas */
async function assurerEntrepriseEtUtilisateur() {
  let entreprise = await prisma.entreprise.findFirst({ where: { demo: true } });
  if (!entreprise) {
    entreprise = await prisma.entreprise.create({
      data: { nom: NOM_DEMO, demo: true, secteur: "Industrie", email: EMAIL_DEMO, telephone: "01 00 00 00 00", ville: "Lyon", contactNom: "Alex Démo", contactPoste: "Responsable RH" },
    });
  }
  let utilisateur = await prisma.utilisateur.findUnique({ where: { email: EMAIL_DEMO } });
  if (!utilisateur) {
    utilisateur = await prisma.utilisateur.create({
      data: { email: EMAIL_DEMO, prenom: "Alex", nom: "Démo", role: "CLIENT", entrepriseId: entreprise.id, motDePasse: await bcrypt.hash(randomBytes(24).toString("hex"), 8) },
    });
  }
  return { entreprise, utilisateur };
}

/** Ouvre la démo : crée ce qui manque et remplit les données si la démo est vide */
export async function preparerDemo(): Promise<{ userId: string }> {
  const { entreprise, utilisateur } = await assurerEntrepriseEtUtilisateur();
  const nb = await prisma.mission.count({ where: { entrepriseId: entreprise.id } });
  if (nb === 0) await remplirDemo(entreprise.id);
  return { userId: utilisateur.id };
}

/** Remise à zéro complète (chaque nuit, ou depuis le bouton de l'administrateur) */
export async function reinitialiserDemo() {
  const { entreprise } = await assurerEntrepriseEtUtilisateur();
  await viderDemo();
  await remplirDemo(entreprise.id);
}
