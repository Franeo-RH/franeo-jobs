// lib/stockage.ts : où sont rangés les CV.
// - Stockage S3 configuré (OVHcloud, Scaleway, Cloudflare R2…) : les CV y sont envoyés.
//   Variables : S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET.
//   (Les anciennes variables R2_* restent acceptées.)
// - Sinon : directement dans la base Neon (pratique pour démarrer, offre gratuite limitée à 0,5 Go).
import { randomUUID } from "crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

const env = (k: string) => (process.env[k] || "").trim();
const CONFIG = {
  endpoint: env("S3_ENDPOINT") || (env("R2_ACCOUNT_ID") ? `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com` : ""),
  region: env("S3_REGION") || "auto",
  cle: env("S3_ACCESS_KEY_ID") || env("R2_ACCESS_KEY_ID"),
  secret: env("S3_SECRET_ACCESS_KEY") || env("R2_SECRET_ACCESS_KEY"),
  bucket: env("S3_BUCKET") || env("R2_BUCKET"),
};
const BUCKET = CONFIG.bucket;

/** Le stockage externe est-il configuré ? */
export const r2Actif = () => !!(CONFIG.endpoint && CONFIG.cle && CONFIG.secret && CONFIG.bucket);

/** Nom lisible du fournisseur (affichage admin) */
export function nomStockage() {
  if (!r2Actif()) return "Base Neon";
  const e = CONFIG.endpoint;
  return e.includes("ovh") ? "OVHcloud Object Storage" : e.includes("r2.cloudflarestorage") ? "Cloudflare R2" : e.includes("scw") ? "Scaleway" : "Stockage S3";
}

/** Réglages visibles dans l'admin (sans les secrets) */
export function etatReglages() {
  return [
    { nom: "S3_ENDPOINT", ok: !!CONFIG.endpoint, valeur: CONFIG.endpoint },
    { nom: "S3_REGION", ok: !!env("S3_REGION") || !!env("R2_ACCOUNT_ID"), valeur: CONFIG.region },
    { nom: "S3_ACCESS_KEY_ID", ok: !!CONFIG.cle, valeur: CONFIG.cle ? "••••" + CONFIG.cle.slice(-4) : "" },
    { nom: "S3_SECRET_ACCESS_KEY", ok: !!CONFIG.secret, valeur: CONFIG.secret ? "••••••••" : "" },
    { nom: "S3_BUCKET", ok: !!CONFIG.bucket, valeur: CONFIG.bucket },
  ];
}

let client: S3Client | null = null;
function r2() {
  if (!client) {
    client = new S3Client({
      region: CONFIG.region,
      endpoint: CONFIG.endpoint,
      forcePathStyle: true, // compatible OVHcloud, Scaleway, R2
      credentials: { accessKeyId: CONFIG.cle, secretAccessKey: CONFIG.secret },
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
  if (!r2Actif()) return "Le stockage n'est pas configuré : il manque une ou plusieurs variables S3_….";
  try {
    const cle = `test/${randomUUID()}.txt`;
    await r2().send(new PutObjectCommand({ Bucket: BUCKET, Key: cle, Body: "Franeo Jobs", ContentType: "text/plain" }));
    await r2().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: cle }));
    return "OK";
  } catch (e) {
    return `Échec : ${e instanceof Error ? e.message : String(e)}`;
  }
}
