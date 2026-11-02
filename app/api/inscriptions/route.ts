// POST (public) : demande d'accès client ou demande de contact depuis la page de connexion ou la démo.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifierAdmin } from "@/lib/notifications";

const envois = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  const b = await request.json().catch(() => ({}));
  if (b.siteWeb) return NextResponse.json({ succes: true });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  const maintenant = Date.now();
  const recents = (envois.get(ip) || []).filter((t) => maintenant - t < 3600_000);
  if (recents.length >= 5) return NextResponse.json({ erreur: "Trop de demandes, réessayez plus tard." }, { status: 429 });

  const t = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const societe = t(b.societe), prenom = t(b.prenom, 80), nom = t(b.nom, 80), email = t(b.email, 160).toLowerCase();
  if (!societe || !prenom || !nom || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ erreur: "Société, prénom, nom et un e-mail valide sont obligatoires." }, { status: 400 });
  }
  const type = b.type === "CONTACT" ? "CONTACT" : "INSCRIPTION";
  await prisma.demandeInscription.create({ data: { societe, prenom, nom, email, telephone: t(b.telephone, 30) || null, message: t(b.message, 2000) || null, type } });
  recents.push(maintenant);
  envois.set(ip, recents);

  await notifierAdmin({
    sujet: `${type === "CONTACT" ? "Demande de contact" : "Demande d'accès client"} — ${societe}`,
    titre: type === "CONTACT" ? "✉️ Nouvelle demande de contact" : "🆕 Nouvelle demande d'accès client",
    lignes: [`${prenom} ${nom} · ${email}`, `Société : ${societe}`, ...(t(b.message, 2000) ? [`Message : ${t(b.message, 2000)}`] : [])],
    lien: "/admin/parametres/demandes",
  });
  return NextResponse.json({ succes: true });
}
