// lib/stockage.ts : où sont rangés les CV.
// - Si les variables R2_* sont renseignées : Cloudflare R2 (10 Go gratuits, aucun frais de téléchargement).
// - Sinon : directement dans la base Neon (pratique pour démarrer, mais l'offre gratuite de Neon est limitée à 0,5 Go).
import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

const BUCKET = process.env.R2_BUCKET || "";
export const r2Actif = () => !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && BUCKET);

let client: S3Client | null = null;
function r2() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
    });
  }
  return client;
}

/** Enregistre un CV et renvoie les champs à écrire sur la fiche candidat */
export async function donneesCv(fichier: { nom: string; type: string; data: Uint8Array }) {
  if (!r2Actif()) return { cvNom: fichier.nom, cvType: fichier.type, cvData: Buffer.from(fichier.data), cvCle: null };
  const extension = fichier.nom.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const cle = `cv/${randomUUID()}.${extension}`;
  await r2().send(new PutObjectCommand({ Bucket: BUCKET, Key: cle, Body: fichier.data, ContentType: fichier.type }));
  return { cvNom: fichier.nom, cvType: fichier.type, cvData: null, cvCle: cle };
}

/** Lit le CV d'un candidat, où qu'il soit rangé */
export async function lireCv(c: { cvData: Uint8Array | Buffer | null; cvCle: string | null }): Promise<Uint8Array | null> {
  if (c.cvCle && r2Actif()) {
    const r = await r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: c.cvCle }));
    return r.Body ? new Uint8Array(await r.Body.transformToByteArray()) : null;
  }
  return c.cvData ? new Uint8Array(c.cvData) : null;
}

/** Efface l'ancien fichier R2 d'un candidat (remplacement de CV ou effacement RGPD). Ne bloque jamais. */
export async function supprimerAncienCv(candidatId: string) {
  try {
    const c = await prisma.candidat.findUnique({ where: { id: candidatId }, select: { cvCle: true } });
    if (c?.cvCle && r2Actif()) await r2().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: c.cvCle }));
  } catch (e) {
    console.error("CV non supprimé du stockage :", e);
  }
}

/** Déplace vers R2 les CV encore rangés dans la base (par lots, pour ne pas dépasser le temps d'exécution) */
export async function migrerVersR2(lot = 40): Promise<{ deplaces: number; restants: number }> {
  if (!r2Actif()) return { deplaces: 0, restants: await prisma.candidat.count({ where: { cvData: { not: null } } }) };
  const liste = await prisma.candidat.findMany({ where: { cvData: { not: null }, cvCle: null }, select: { id: true, cvNom: true, cvType: true, cvData: true }, take: lot });
  let deplaces = 0;
  for (const c of liste) {
    try {
      const champs = await donneesCv({ nom: c.cvNom || "cv.pdf", type: c.cvType || "application/pdf", data: new Uint8Array(c.cvData!) });
      await prisma.candidat.update({ where: { id: c.id }, data: { cvCle: champs.cvCle, cvData: null } });
      deplaces++;
    } catch (e) {
      console.error("Migration du CV impossible pour", c.id, e);
    }
  }
  const restants = await prisma.candidat.count({ where: { cvData: { not: null }, cvCle: null } });
  return { deplaces, restants };
}

/** Vérifie que R2 répond (écriture puis suppression d'un petit fichier test) */
export async function testerR2(): Promise<string> {
  if (!r2Actif()) return "R2 n'est pas configuré : il manque une ou plusieurs variables R2_….";
  try {
    const cle = `test/${randomUUID()}.txt`;
    await r2().send(new PutObjectCommand({ Bucket: BUCKET, Key: cle, Body: "Franeo Jobs", ContentType: "text/plain" }));
    await r2().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: cle }));
    return "OK";
  } catch (e) {
    return `Échec : ${e instanceof Error ? e.message : String(e)}`;
  }
}
