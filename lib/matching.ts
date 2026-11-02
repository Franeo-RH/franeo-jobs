// lib/matching.ts
// Score de compatibilité candidat / mission : métier 30 %, compétences 25 %, géographie 15 %, salaire 15 %, disponibilité 15 %.

type CandidatPourMatching = {
  metier: string; competences: string[]; ville: string | null; mobilite: string | null;
  salaireSouhaite: number | null; disponibilite: string | null;
};
type MissionPourMatching = {
  categorie: string; competences: string[]; lieu: string; salaireMin: number | null; salaireMax: number | null;
};

const DISPO: Record<string, number> = { "Immédiate": 1, "1 mois": 0.8, "2 mois": 0.5, "3 mois": 0.3, "Plus de 3 mois": 0.1 };
const minus = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function scoreMatching(c: CandidatPourMatching, m: MissionPourMatching) {
  const metier = c.metier === m.categorie ? 1 : 0;
  const reqs = m.competences.map(minus);
  const communes = c.competences.filter((k) => reqs.includes(minus(k))).length;
  const competences = reqs.length ? Math.min(1, communes / Math.min(2, reqs.length)) : 0;
  const lieu = minus(m.lieu);
  const geo = c.ville && minus(c.ville) === lieu ? 1 : c.mobilite && (minus(c.mobilite).includes(lieu) || minus(c.mobilite).includes("france")) ? 0.6 : 0;
  let salaire = 0.5; // inconnu : neutre
  if (c.salaireSouhaite && (m.salaireMin || m.salaireMax)) {
    const min = m.salaireMin ?? 0;
    const max = m.salaireMax ?? Number.MAX_SAFE_INTEGER;
    salaire = c.salaireSouhaite >= min - 2000 && c.salaireSouhaite <= max + 2000 ? 1 : c.salaireSouhaite <= max + 6000 ? 0.5 : 0;
  }
  const dispo = DISPO[c.disponibilite ?? ""] ?? 0.3;
  const total = Math.round(100 * (0.3 * metier + 0.25 * competences + 0.15 * geo + 0.15 * salaire + 0.15 * dispo));
  return { metier, competences, geo, salaire, dispo, total };
}
