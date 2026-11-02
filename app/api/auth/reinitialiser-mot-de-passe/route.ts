import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { token, motDePasse } = await request.json().catch(() => ({}));
  if (typeof token !== "string" || typeof motDePasse !== "string" || motDePasse.length < 8) {
    return NextResponse.json({ erreur: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }
  const t = await prisma.tokenReset.findUnique({ where: { token } });
  if (!t || t.expireAt < new Date()) return NextResponse.json({ erreur: "Ce lien a expiré. Refaites une demande." }, { status: 400 });
  await prisma.utilisateur.update({ where: { id: t.utilisateurId }, data: { motDePasse: await bcrypt.hash(motDePasse, 10) } });
  await prisma.tokenReset.deleteMany({ where: { utilisateurId: t.utilisateurId } });
  return NextResponse.json({ succes: true });
}
