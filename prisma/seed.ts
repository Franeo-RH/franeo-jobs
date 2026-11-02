// prisma/seed.ts : crée le premier compte administrateur (à lancer une seule fois : npm run seed)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const mdp = process.env.ADMIN_PASSWORD || "";
  if (!email || mdp.length < 8) {
    throw new Error("Renseignez ADMIN_EMAIL et ADMIN_PASSWORD (8 caractères minimum) dans .env avant de lancer le seed.");
  }
  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant) {
    console.log(`Le compte ${email} existe déjà : rien à faire.`);
    return;
  }
  await prisma.utilisateur.create({ data: { email, motDePasse: await bcrypt.hash(mdp, 10), prenom: "Admin", nom: "FRANEO RH", role: "ADMIN" } });
  for (const r of ["J7", "J30", "J90"]) {
    await prisma.parametre.upsert({ where: { cle: `relance_${r}` }, create: { cle: `relance_${r}`, valeur: "1" }, update: {} });
  }
  console.log(`Compte administrateur créé : ${email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
