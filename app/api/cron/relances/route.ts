// Appelée chaque matin par Vercel (voir vercel.json) : envoie les relances J+7, J+30 et J+90 arrivées à échéance.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { envoyerRelance, reglesActives } from "@/lib/relances";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  }
  const actives = await reglesActives();
  const dues = await prisma.relance.findMany({ where: { envoyeeAt: null, prevueLe: { lte: new Date() }, candidat: { demo: false } }, take: 100, orderBy: { prevueLe: "asc" } });
  let envoyees = 0;
  for (const r of dues) {
    if (actives[r.regle] === false) continue;
    if (await envoyerRelance(r.id)) envoyees += 1;
  }
  return NextResponse.json({ ok: true, envoyees });
}
