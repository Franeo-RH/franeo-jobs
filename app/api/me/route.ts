import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  return NextResponse.json({ prenom: s.prenom, role: s.role, entreprise: s.entreprise?.nom ?? null, demo: !!s.entreprise?.demo });
}
