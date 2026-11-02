// lib/filtres-candidats.ts : les mêmes filtres pour la CVthèque et pour son export Excel.
import type { Prisma } from "@prisma/client";

export type ParamsCandidats = Record<string, string | string[] | undefined>;
const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export function whereCandidats(sp: ParamsCandidats): Prisma.CandidatWhereInput {
  const q = un(sp.q).trim();
  const salaire = un(sp.salaire);
  const where: Prisma.CandidatWhereInput = { demo: false };
  if (q) {
    where.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { prenom: { contains: q, mode: "insensitive" } },
      { poste: { contains: q, mode: "insensitive" } },
      { ville: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (un(sp.metier)) where.metier = un(sp.metier);
  if (un(sp.statut)) where.statut = un(sp.statut);
  if (un(sp.source)) where.source = un(sp.source);
  if (un(sp.ville)) where.ville = { equals: un(sp.ville), mode: "insensitive" };
  if (un(sp.dispo)) where.disponibilite = un(sp.dispo);
  if (un(sp.teletravail)) where.teletravail = un(sp.teletravail);
  if (un(sp.competence)) where.competences = { has: un(sp.competence) };
  if (salaire === "moins35") where.salaireSouhaite = { lt: 35000 };
  else if (salaire === "35-45") where.salaireSouhaite = { gte: 35000, lte: 45000 };
  else if (salaire === "plus45") where.salaireSouhaite = { gt: 45000 };
  return where;
}
