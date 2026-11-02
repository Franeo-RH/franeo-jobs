// GET : télécharge le CV d'un candidat.
// Admin : toujours. Candidat : uniquement son propre CV. Client : seulement si le candidat lui a été présenté (le téléchargement est inscrit au registre).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { journaliser } from "@/lib/registre";
import { lireCv } from "@/lib/stockage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });

  const candidat = await prisma.candidat.findUnique({ where: { id }, select: { id: true, prenom: true, nom: true, cvNom: true, cvType: true, cvData: true, cvCle: true } });
  if (!candidat || (!candidat.cvData && !candidat.cvCle)) return NextResponse.json({ erreur: "Aucun CV pour ce candidat." }, { status: 404 });

  if (session.role === "CANDIDAT" && session.candidatId !== id) return NextResponse.json({ erreur: "Non autorisé" }, { status: 403 });
  if (session.role === "CLIENT") {
    const presentationId = request.nextUrl.searchParams.get("presentation") || "";
    const p = await prisma.presentation.findFirst({ where: { id: presentationId, candidatId: id, entrepriseId: session.entrepriseId ?? "__aucune__" } });
    if (!p) return NextResponse.json({ erreur: "Non autorisé" }, { status: 403 });
    if (!p.cvTelechargeAt) await prisma.presentation.update({ where: { id: p.id }, data: { cvTelechargeAt: new Date() } });
    await journaliser({ type: "TELECHARGEMENT_CV", detail: `CV de ${candidat.prenom} ${candidat.nom} téléchargé`, acteur: `${session.prenom} ${session.nom}`.trim(), presentationId: p.id, candidatId: id, entrepriseId: p.entrepriseId });
  }

  const contenu = await lireCv(candidat);
  if (!contenu) return NextResponse.json({ erreur: "CV introuvable dans le stockage." }, { status: 404 });
  const extension = (candidat.cvNom || "").split(".").pop() || "pdf";
  const nomFichier = `CV-${candidat.prenom}-${candidat.nom}.${extension}`.replace(/[^\w.\-]+/g, "_");
  return new NextResponse(new Uint8Array(contenu), {
    headers: {
      "Content-Type": candidat.cvType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
