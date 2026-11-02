// GET : lien reçu par e-mail. Active l'espace candidat et connecte directement la personne.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const t = token ? await prisma.tokenReset.findUnique({ where: { token } }) : null;
  if (!t || t.expireAt < new Date()) return NextResponse.redirect(new URL("/espace-candidat?lien=expire", request.url));
  const u = await prisma.utilisateur.update({ where: { id: t.utilisateurId }, data: { actif: true } });
  await prisma.tokenReset.deleteMany({ where: { utilisateurId: u.id } });
  const r = request.nextUrl.searchParams.get("retour") || "";
  const retour = r.startsWith("/") && !r.startsWith("//") ? r : "/candidat?bienvenue=1";
  const res = NextResponse.redirect(new URL(retour, request.url));
  res.cookies.set("userId", u.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
