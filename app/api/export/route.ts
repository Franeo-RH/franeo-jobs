// GET /api/export?type=... : exports Excel. Admin : toute la base (hors démo). Client : seulement ses propres dossiers.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { reponseExcel, dateFR } from "@/lib/export";
import { whereCandidats } from "@/lib/filtres-candidats";
import { STATUTS_CANDIDAT, STATUTS_MISSION, STATUTS_OFFRE, STATUTS_PRESENTATION, STATUTS_FACTURE, TYPES_REGISTRE, libelleEtape } from "@/lib/constantes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  const sp = Object.fromEntries(request.nextUrl.searchParams.entries());
  const type = sp.type || "";
  const jour = new Date().toISOString().slice(0, 10);

  // ───── Client : ses dossiers uniquement ─────
  if (session.role === "CLIENT") {
    const entrepriseId = session.entrepriseId as string;
    const pres = await prisma.presentation.findMany({
      where: { entrepriseId },
      include: { candidat: true, mission: true },
      orderBy: { envoyeAt: "desc" },
    });
    const lignes = pres.map((p) => ({
      "Mission": p.mission.reference, "Poste": p.mission.poste,
      "Candidat": `${p.candidat.prenom} ${p.candidat.nom}`, "Ville": p.candidat.ville ?? "",
      "Expérience": p.candidat.experience ?? "", "Disponibilité": p.candidat.disponibilite ?? "",
      "Salaire souhaité": p.candidat.salaireSouhaite ?? "", "Préavis": p.candidat.preavis ?? "",
      "Présenté le": dateFR(p.envoyeAt), "Statut": STATUTS_PRESENTATION[p.statut]?.label ?? p.statut,
      "Motif de refus": p.motifRefus ?? "", "Feedback": p.feedback ?? "",
    }));
    return reponseExcel(`franeo-jobs-candidats-${jour}.xlsx`, [{ nom: "Candidats présentés", lignes }]);
  }

  // ───── Admin ─────
  if (session.role !== "ADMIN") return NextResponse.json({ erreur: "Non autorisé" }, { status: 403 });

  if (type === "candidats") {
    const l = await prisma.candidat.findMany({ where: whereCandidats(sp), orderBy: { createdAt: "desc" } });
    return reponseExcel(`franeo-jobs-cvtheque-${jour}.xlsx`, [{
      nom: "CVthèque",
      lignes: l.map((c) => ({
        "Nom": c.nom, "Prénom": c.prenom, "E-mail": c.email ?? "", "Téléphone": c.telephone ?? "", "Ville": c.ville ?? "",
        "Métier": c.metier, "Poste recherché": c.poste ?? "", "Compétences": c.competences.join(", "), "Expérience": c.experience ?? "", "Niveau": c.niveau ?? "",
        "Disponibilité": c.disponibilite ?? "", "Mobilité": c.mobilite ?? "", "Télétravail": c.teletravail ?? "", "Salaire souhaité": c.salaireSouhaite ?? "", "Préavis": c.preavis ?? "",
        "Statut": STATUTS_CANDIDAT[c.statut]?.label ?? c.statut, "Source": c.source, "Score test": c.scoreTest ?? "", "Dernier contact": dateFR(c.dernierContact), "Créé le": dateFR(c.createdAt),
      })),
    }]);
  }
  if (type === "clients") {
    const l = await prisma.entreprise.findMany({ where: { demo: false }, include: { _count: { select: { missions: true, presentations: true, factures: true } } }, orderBy: { nom: "asc" } });
    return reponseExcel(`franeo-jobs-clients-${jour}.xlsx`, [{
      nom: "Clients",
      lignes: l.map((e) => ({ "Raison sociale": e.nom, "Secteur": e.secteur ?? "", "Contact": e.contactNom ?? "", "E-mail": e.email ?? "", "Téléphone": e.telephone ?? "", "Ville": e.ville ?? "", "Honoraires (%)": e.tauxHonoraires, "Garantie (mois)": e.garantieMois, "Missions": e._count.missions, "Candidats présentés": e._count.presentations, "Recrutements": e._count.factures, "Actif": e.actif ? "Oui" : "Non" })),
    }]);
  }
  if (type === "missions") {
    const l = await prisma.mission.findMany({ where: { entreprise: { demo: false } }, include: { entreprise: true, _count: { select: { candidatures: true, presentations: true } } }, orderBy: { createdAt: "desc" } });
    return reponseExcel(`franeo-jobs-missions-${jour}.xlsx`, [{
      nom: "Missions",
      lignes: l.map((m) => ({ "Référence": m.reference, "Client": m.entreprise.nom, "Poste": m.poste, "Métier": m.categorie, "Postes": m.nbPostes, "Contrat": m.contrat, "Lieu": m.lieu, "Salaire min": m.salaireMin ?? "", "Salaire max": m.salaireMax ?? "", "Statut": STATUTS_MISSION[m.statut]?.label ?? m.statut, "Consultant": m.consultant ?? "", "Candidatures": m._count.candidatures, "Présentés": m._count.presentations, "Ouverte le": dateFR(m.createdAt) })),
    }]);
  }
  if (type === "offres") {
    const l = await prisma.offre.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { candidatures: true } } } });
    return reponseExcel(`franeo-jobs-offres-${jour}.xlsx`, [{
      nom: "Offres",
      lignes: l.map((o) => ({ "Titre": o.titre, "Métier": o.categorie, "Contrat": o.contrat, "Lieu": o.lieu, "Statut": STATUTS_OFFRE[o.statut]?.label ?? o.statut, "Diffusion": o.diffusion.join(", "), "Candidatures": o._count.candidatures, "Publiée le": dateFR(o.publieeAt) })),
    }]);
  }
  if (type === "presentations") {
    const l = await prisma.presentation.findMany({ where: { entreprise: { demo: false } }, include: { candidat: true, mission: true, entreprise: true }, orderBy: { envoyeAt: "desc" } });
    return reponseExcel(`franeo-jobs-presentations-${jour}.xlsx`, [{
      nom: "Présentations",
      lignes: l.map((p) => ({ "Client": p.entreprise.nom, "Mission": p.mission.reference, "Candidat": `${p.candidat.prenom} ${p.candidat.nom}`, "Envoyé le": dateFR(p.envoyeAt), "Consultant": p.consultant, "Destinataires": p.destinataires.join(", "), "E-mail ouvert le": dateFR(p.ouvertAt), "Dossier consulté le": dateFR(p.consulteAt), "CV téléchargé le": dateFR(p.cvTelechargeAt), "Statut": STATUTS_PRESENTATION[p.statut]?.label ?? p.statut, "Motif de refus": p.motifRefus ?? "", "Feedback": p.feedback ?? "" })),
    }]);
  }
  if (type === "registre") {
    const l = await prisma.journalRegistre.findMany({ orderBy: { createdAt: "desc" }, take: 20000 });
    return reponseExcel(`franeo-jobs-registre-anti-litiges-${jour}.xlsx`, [{
      nom: "Registre",
      lignes: l.map((j) => ({ "Date et heure": j.createdAt.toLocaleString("fr-FR", { timeZone: "Europe/Paris" }), "Type": TYPES_REGISTRE[j.type]?.label ?? j.type, "Détail": j.detail, "Acteur": j.acteur, "Présentation": j.presentationId ?? "" })),
    }]);
  }
  if (type === "facturation") {
    const l = await prisma.facture.findMany({ where: { entreprise: { demo: false } }, include: { candidat: true, mission: true, entreprise: true }, orderBy: { createdAt: "desc" } });
    return reponseExcel(`franeo-jobs-facturation-${jour}.xlsx`, [{
      nom: "Facturation",
      lignes: l.map((f) => ({ "Client": f.entreprise.nom, "Mission": f.mission.reference, "Candidat": `${f.candidat.prenom} ${f.candidat.nom}`, "Embauche le": dateFR(f.dateEmbauche), "Salaire annuel": f.salaireAnnuel, "Taux (%)": f.taux, "Honoraires": f.honoraires, "Fin de garantie": dateFR(f.finGarantie), "Statut": STATUTS_FACTURE[f.statut]?.label ?? f.statut })),
    }]);
  }
  if (type === "pipeline") {
    const l = await prisma.candidature.findMany({ where: { mission: { entreprise: { demo: false } } }, include: { candidat: true, mission: true }, orderBy: { updatedAt: "desc" } });
    return reponseExcel(`franeo-jobs-pipeline-${jour}.xlsx`, [{
      nom: "Pipeline",
      lignes: l.map((c) => ({ "Mission": c.mission?.reference ?? "", "Poste": c.mission?.poste ?? "", "Candidat": `${c.candidat.prenom} ${c.candidat.nom}`, "Étape": libelleEtape(c.etape), "Score test": c.scoreTest ?? "", "Reçue le": dateFR(c.createdAt) })),
    }]);
  }
  return NextResponse.json({ erreur: "Type d'export inconnu" }, { status: 400 });
}
