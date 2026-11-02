import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { envoyerMail, APP_URL } from "@/lib/notifications";

// Toujours la même réponse, que l'adresse existe ou non (pas de fuite d'information)
export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));
  if (typeof email === "string") {
    const u = await prisma.utilisateur.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (u && u.actif) {
      const token = randomBytes(32).toString("hex");
      await prisma.tokenReset.create({ data: { token, utilisateurId: u.id, expireAt: new Date(Date.now() + 3600_000) } });
      await envoyerMail({
        a: u.email,
        sujet: "Réinitialisation de votre mot de passe Franeo Jobs",
        titre: `Bonjour ${u.prenom},`,
        lignes: ["Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure.", "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."],
        lien: `${APP_URL}/reinitialiser-mot-de-passe?token=${token}`,
        bouton: "Choisir un nouveau mot de passe",
      });
    }
  }
  return NextResponse.json({ succes: true });
}
