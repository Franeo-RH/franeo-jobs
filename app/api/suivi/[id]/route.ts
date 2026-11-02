// GET : image invisible (1 pixel) placée dans l'e-mail de présentation.
// Quand le client ouvre l'e-mail, l'ouverture est horodatée dans le registre anti-litiges.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { journaliser } from "@/lib/registre";

export const dynamic = "force-dynamic";

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const p = await prisma.presentation.findUnique({ where: { id }, select: { id: true, ouvertAt: true, candidatId: true, entrepriseId: true } });
    if (p && !p.ouvertAt) {
      await prisma.presentation.update({ where: { id: p.id }, data: { ouvertAt: new Date() } });
      await journaliser({ type: "OUVERTURE", detail: "E-mail de présentation ouvert", acteur: "Destinataire", presentationId: p.id, candidatId: p.candidatId, entrepriseId: p.entrepriseId });
    }
  } catch {
    // le pixel ne doit jamais échouer
  }
  return new NextResponse(new Uint8Array(GIF), { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" } });
}
