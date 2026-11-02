// POST (admin) : remet la démo à zéro tout de suite.
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { reinitialiserDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  await reinitialiserDemo();
  return NextResponse.json({ ok: true });
}
