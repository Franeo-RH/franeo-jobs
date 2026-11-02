// POST (public) : création de l'espace candidat. Le compte n'est activé qu'après un clic dans l'e-mail reçu,
// pour qu'on ne puisse pas ouvrir l'espace de quelqu'un d'autre avec son adresse.
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { APP_URL, envoyerMail } from "@/lib/notifications";

const essais = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  const b = await request.json().catch(() => ({}));
  if (b.siteWeb) return NextResponse.json({ succes: true });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  const recents = (essais.get(ip) || []).filter((t) => Date.now() - t < 3600_000);
  if (recents.length >= 6) return NextResponse.json({ erreur: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  recents.push(Date.now());
  essais.set(ip, recents);

  const t = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const prenom = t(b.prenom), nom = t(b.nom), email = t(b.email, 160).toLowerCase(), mdp = typeof b.motDePasse === "string" ? b.motDePasse : "";
  if (!prenom || !nom || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ erreur: "Prénom, nom et un e-mail valide sont obligatoires." }, { status: 400 });
  if (mdp.length < 8) return NextResponse.json({ erreur: "Le mot de passe doit faire 8 caractères minimum." }, { status: 400 });
  if (!b.consentement) return NextResponse.json({ erreur: "Cochez la case de consentement." }, { status: 400 });

  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant && (existant.actif || existant.role !== "CANDIDAT")) {
    // Même réponse que pour un succès : on ne révèle pas qu'un compte existe déjà
    return NextResponse.json({ succes: true });
  }

  // Fiche CVthèque : on reprend celle qui existe (le candidat a déjà postulé) ou on en crée une
  let candidat = await prisma.candidat.findUnique({ where: { email } });
  if (!candidat) candidat = await prisma.candidat.create({ data: { prenom, nom, email, source: "Site Franeo Jobs", consentementAt: new Date() } });
  const motDePasse = await bcrypt.hash(mdp, 10);
  const compte = existant
    ? await prisma.utilisateur.update({ where: { id: existant.id }, data: { motDePasse, prenom, nom, candidatId: candidat.id } })
    : await prisma.utilisateur.create({ data: { email, motDePasse, prenom, nom, role: "CANDIDAT", actif: false, candidatId: candidat.id } });

  const token = randomBytes(32).toString("hex");
  await prisma.tokenReset.create({ data: { token, utilisateurId: compte.id, expireAt: new Date(Date.now() + 48 * 3600_000) } });
  const r = typeof b.retour === "string" ? b.retour : "";
  const retour = r.startsWith("/") && !r.startsWith("//") ? r : "";
  const lien = `${APP_URL}/api/candidat/activer?token=${token}${retour ? `&retour=${encodeURIComponent(retour)}` : ""}`;
  const envoye = await envoyerMail({
    a: email, sujet: "Activez votre espace candidat Franeo Jobs", titre: `Bonjour ${prenom},`,
    lignes: ["Cliquez sur le bouton pour activer votre espace candidat (lien valable 48 heures). Vous pourrez ensuite postuler aux offres.", "Vous pourrez y suivre vos candidatures, vos résultats et mettre à jour vos informations."],
    lien, bouton: "Activer mon espace",
  });
  if (!envoye) console.log(`[Franeo Jobs] E-mail non configuré. Lien d'activation pour ${email} : ${lien}`);
  return NextResponse.json({ succes: true });
}
