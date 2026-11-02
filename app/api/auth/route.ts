import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { email, motDePasse } = await request.json().catch(() => ({}));
  const echec = NextResponse.json({ erreur: "Email ou mot de passe incorrect" }, { status: 401 });
  if (typeof email !== "string" || typeof motDePasse !== "string") return echec;

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!utilisateur || !utilisateur.actif) return echec;
  if (!(await bcrypt.compare(motDePasse, utilisateur.motDePasse))) return echec;

  const response = NextResponse.json({ succes: true, role: utilisateur.role });
  response.cookies.set("userId", utilisateur.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });
  return response;
}
