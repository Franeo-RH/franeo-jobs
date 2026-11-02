// lib/constantes.ts
// Listes et libellés partagés par tout Franeo Jobs (utilisables côté navigateur et serveur).

export type Pastille = { label: string; fond: string; texte: string };

// ── Classement du vivier ──
export const CATEGORIES = ["Commercial", "Ressources Humaines", "Paie", "Comptabilité", "Administratif", "Direction", "Informatique", "Industrie", "BTP", "Autres"] as const;

// ── Statuts d'un candidat dans la CVthèque ──
export const STATUTS_CANDIDAT: Record<string, Pastille> = {
  NOUVEAU: { label: "Nouveau", fond: "#dbeafe", texte: "#1d4ed8" },
  A_CONTACTER: { label: "À contacter", fond: "#fef3c7", texte: "#b45309" },
  ENTRETIEN_REALISE: { label: "Entretien réalisé", fond: "#e0e7ff", texte: "#4338ca" },
  QUALIFIE: { label: "Qualifié", fond: "#dcfce7", texte: "#15803d" },
  VIVIER: { label: "Vivier", fond: "#f3f4f6", texte: "#4b5563" },
  PRESENTABLE: { label: "Présentable", fond: "#ede9fe", texte: "#6d28d9" },
  RECRUTE: { label: "Recruté", fond: "#bbf7d0", texte: "#166534" },
  NON_RETENU: { label: "Non retenu", fond: "#fee2e2", texte: "#b91c1c" },
};

// ── Étapes du pipeline d'une candidature ──
export const ETAPES: { code: string; label: string }[] = [
  { code: "NOUVEAU", label: "Nouveau" },
  { code: "PREQUALIFICATION", label: "Préqualification" },
  { code: "ENTRETIEN_FRANEO", label: "Entretien FRANEO" },
  { code: "PRESENTABLE", label: "Présentable" },
  { code: "PRESENTE", label: "Présenté au client" },
  { code: "ENTRETIEN_CLIENT", label: "Entretien client" },
  { code: "PROPOSITION", label: "Proposition" },
  { code: "EMBAUCHE", label: "Embauché" },
  { code: "REFUSE", label: "Refusé" },
];
export const libelleEtape = (code: string) => ETAPES.find((e) => e.code === code)?.label ?? code;

// ── Missions ──
export const STATUTS_MISSION: Record<string, Pastille> = {
  BROUILLON: { label: "Brouillon", fond: "#f3f4f6", texte: "#4b5563" },
  OUVERTE: { label: "Ouverte", fond: "#dbeafe", texte: "#1d4ed8" },
  EN_SOURCING: { label: "En sourcing", fond: "#ede9fe", texte: "#6d28d9" },
  EN_PRESENTATION: { label: "En présentation", fond: "#fef3c7", texte: "#b45309" },
  POURVUE: { label: "Pourvue", fond: "#dcfce7", texte: "#15803d" },
  CLOTUREE: { label: "Clôturée", fond: "#e5e7eb", texte: "#374151" },
};
export const MISSIONS_OUVERTES = ["OUVERTE", "EN_SOURCING", "EN_PRESENTATION"];

// ── Offres ──
export const STATUTS_OFFRE: Record<string, Pastille> = {
  BROUILLON: { label: "Brouillon", fond: "#f3f4f6", texte: "#4b5563" },
  PUBLIEE: { label: "Publiée", fond: "#dcfce7", texte: "#15803d" },
  SUSPENDUE: { label: "Suspendue", fond: "#fef3c7", texte: "#b45309" },
  POURVUE: { label: "Pourvue", fond: "#dbeafe", texte: "#1d4ed8" },
  ARCHIVEE: { label: "Archivée", fond: "#e5e7eb", texte: "#374151" },
};

// ── Présentations (retour du client) ──
export const STATUTS_PRESENTATION: Record<string, Pastille> = {
  EN_ATTENTE: { label: "En attente", fond: "#f3f4f6", texte: "#4b5563" },
  RETENU: { label: "Retenu", fond: "#dcfce7", texte: "#15803d" },
  A_REVOIR: { label: "À revoir", fond: "#fef3c7", texte: "#b45309" },
  REFUSE: { label: "Refusé", fond: "#fee2e2", texte: "#b91c1c" },
};
export const MOTIFS_REFUS = ["Profil insuffisant", "Prétentions salariales", "Autre candidat retenu", "Mobilité", "Disponibilité", "Autre motif"];

// ── Registre anti-litiges ──
export const TYPES_REGISTRE: Record<string, { label: string; icone: string }> = {
  ENVOI: { label: "Envoi du dossier", icone: "📤" },
  OUVERTURE: { label: "Ouverture de l'e-mail", icone: "📬" },
  CONSULTATION: { label: "Consultation du dossier", icone: "👁️" },
  TELECHARGEMENT_CV: { label: "Téléchargement du CV", icone: "📥" },
  REPONSE: { label: "Réponse du client", icone: "💬" },
  DOUBLON_FORCE: { label: "Doublon confirmé", icone: "⚠️" },
  ECHANGE: { label: "Échange", icone: "✉️" },
};

// ── Notes du journal des actions ──
export const TYPES_NOTE: Record<string, string> = {
  COMMENTAIRE: "Commentaire",
  NOTE_INTERNE: "Note interne",
  ECHANGE: "Échange",
  DOCUMENT: "Document transmis",
};

// ── Facturation ──
export const STATUTS_FACTURE: Record<string, Pastille> = {
  A_EMETTRE: { label: "À émettre", fond: "#fef3c7", texte: "#b45309" },
  ENVOYEE: { label: "Envoyée", fond: "#dbeafe", texte: "#1d4ed8" },
  PAYEE: { label: "Payée", fond: "#dcfce7", texte: "#15803d" },
};

// ── Divers ──
export const CONTRATS = ["CDI", "CDD", "Intérim", "Alternance", "Stage", "Freelance"];
export const DISPONIBILITES = ["Immédiate", "1 mois", "2 mois", "3 mois", "Plus de 3 mois"];
export const TELETRAVAIL = ["Non", "Partiel", "Oui"];
export const NIVEAUX = ["Sans diplôme", "Bac", "Bac+2", "Bac+3", "Bac+5", "Bac+8"];
export const SOURCES = ["Site Franeo Jobs", "LinkedIn", "Indeed", "APEC", "Cooptation", "Réseau Franeo", "Import manuel"];
export const CANAUX_DIFFUSION = ["Site Franeo Jobs", "LinkedIn", "Indeed", "APEC"];

// ── Relances automatiques ──
export const REGLES_RELANCE: Record<string, { jours: number; titre: string; objectif: string; sujet: string; message: string }> = {
  J7: { jours: 7, titre: "J+7", objectif: "Maintien du contact", sujet: "Votre candidature chez FRANEO RH", message: "Merci pour votre candidature. Nous l'étudions avec attention et revenons vers vous rapidement. Votre situation a-t-elle évolué depuis votre envoi ?" },
  J30: { jours: 30, titre: "J+30", objectif: "Mise à jour de la disponibilité", sujet: "Êtes-vous toujours disponible ?", message: "Pouvez-vous nous confirmer votre disponibilité et vos prétentions salariales actuelles ? Cela nous permet de vous proposer les bonnes missions." },
  J90: { jours: 90, titre: "J+90", objectif: "Réactivation du vivier", sujet: "De nouvelles opportunités chez FRANEO RH", message: "De nouvelles missions correspondent peut-être à votre profil. Êtes-vous toujours en recherche ? Répondez simplement à ce message." },
};

// ── Mise en forme ──
export const formatDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "—";
export const formatDateHeure = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export const euros = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const fourchette = (min?: number | null, max?: number | null) =>
  min && max ? `${Math.round(min / 1000)}–${Math.round(max / 1000)} k€` : min ? `dès ${Math.round(min / 1000)} k€` : max ? `jusqu'à ${Math.round(max / 1000)} k€` : "—";

export function slugifier(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}
