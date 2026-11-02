import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  if (s.entreprise?.demo) return NextResponse.json({ erreur: "Le mot de passe de la démo ne peut pas être modifié." }, { status: 403 });
  const { actuel, nouveau } = await request.json().catch(() => ({}));
  if (typeof nouveau !== "string" || nouveau.length < 8) return NextResponse.json({ erreur: "Le nouveau mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  if (typeof actuel !== "string" || !(await bcrypt.compare(actuel, s.motDePasse))) return NextResponse.json({ erreur: "Mot de passe actuel incorrect." }, { status: 400 });
  await prisma.utilisateur.update({ where: { id: s.id }, data: { motDePasse: await bcrypt.hash(nouveau, 10) } });
  return NextResponse.json({ succes: true });
}
