// POST (candidat connecté à son espace) : un candidat postule à une offre ou dépose son CV (candidature spontanée).
// Corrige le questionnaire côté serveur, crée ou met à jour la fiche dans la CVthèque, programme les relances.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, SOURCES } from "@/lib/constantes";
import { QUESTIONNAIRES, cleDeLOffre, cleParCategorie, corriger } from "@/lib/questionnaires";
import { planifierRelances } from "@/lib/relances";
import { envoyerMail, notifierAdmin } from "@/lib/notifications";
import { getSession } from "@/lib/session";
import { donneesCv, supprimerAncienCv } from "@/lib/stockage";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TAILLE_MAX = 5 * 1024 * 1024; // 5 Mo
const TYPES_CV: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// Limite simple : 8 envois par adresse IP et par heure
const envois = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "CANDIDAT" || !session.candidatId) {
    return NextResponse.json({ erreur: "Connectez-vous à votre espace candidat pour postuler." }, { status: 401 });
  }
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ erreur: "Formulaire invalide." }, { status: 400 });
  if (form.get("siteWeb")) return NextResponse.json({ succes: true }); // champ piège anti-robots

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  const maintenant = Date.now();
  const recents = (envois.get(ip) || []).filter((t) => maintenant - t < 3600_000);
  if (recents.length >= 8) return NextResponse.json({ erreur: "Trop d'envois depuis cette connexion, réessayez plus tard." }, { status: 429 });

  const texte = (k: string, max = 200) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  };
  const prenom = texte("prenom", 80);
  const nom = texte("nom", 80);
  const email = session.email; // toujours l'adresse du compte, jamais celle saisie
  if (!prenom || !nom || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ erreur: "Prénom, nom et un e-mail valide sont obligatoires." }, { status: 400 });
  }
  if (form.get("consentement") !== "on") {
    return NextResponse.json({ erreur: "Vous devez accepter la conservation de votre candidature pour continuer." }, { status: 400 });
  }

  // CV (facultatif pour une candidature à une offre, conseillé dans tous les cas)
  let cv: { nom: string; type: string; data: Buffer } | null = null;
  const fichier = form.get("cv");
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX) return NextResponse.json({ erreur: "Le CV dépasse 5 Mo." }, { status: 400 });
    if (!TYPES_CV[fichier.type]) return NextResponse.json({ erreur: "Le CV doit être un fichier PDF ou Word." }, { status: 400 });
    cv = { nom: fichier.name.slice(0, 120), type: fichier.type, data: Buffer.from(await fichier.arrayBuffer()) };
  }

  // Offre visée (doit être publiée) ou candidature spontanée
  const offreId = texte("offreId", 60);
  const offre = offreId ? await prisma.offre.findUnique({ where: { id: offreId }, include: { mission: true } }) : null;
  if (offreId && (!offre || offre.statut !== "PUBLIEE")) {
    return NextResponse.json({ erreur: "Cette offre n'est plus disponible." }, { status: 400 });
  }

  const metierChoisi = texte("metier", 60);
  const metier = offre ? offre.categorie : (CATEGORIES as readonly string[]).includes(metierChoisi) ? metierChoisi : "Autres";
  const sourceDemandee = texte("source", 40);
  const source = (SOURCES as readonly string[]).includes(sourceDemandee) ? sourceDemandee : "Site Franeo Jobs";

  // Questionnaire : on retient celui du serveur, jamais celui annoncé par le navigateur
  const cle = offre ? cleDeLOffre(offre) : cleParCategorie(metier);
  let test: ReturnType<typeof corriger> | null = null;
  let reponses: (string | number | null)[] = [];
  if (cle && QUESTIONNAIRES[cle]) {
    try {
      const brut = JSON.parse(texte("reponses", 20000) || "[]");
      reponses = Array.isArray(brut) ? brut.slice(0, QUESTIONNAIRES[cle].questions.length).map((r) => (typeof r === "string" ? r.slice(0, 1500) : typeof r === "number" ? r : null)) : [];
    } catch {
      reponses = [];
    }
    test = corriger(cle, reponses);
  }

  const salaire = parseInt(texte("salaireSouhaite", 10).replace(/\D/g, ""), 10);
  const competences = texte("competences", 300).split(",").map((c) => c.trim()).filter(Boolean).slice(0, 15);
  const champs = {
    prenom, nom,
    telephone: texte("telephone", 30) || null,
    ville: texte("ville", 80) || null,
    linkedin: texte("linkedin", 200) || null,
    poste: texte("poste", 120) || offre?.titre || null,
    experience: texte("experience", 60) || null,
    niveau: texte("niveau", 40) || null,
    disponibilite: texte("disponibilite", 40) || null,
    mobilite: texte("mobilite", 120) || null,
    teletravail: texte("teletravail", 20) || null,
    preavis: texte("preavis", 60) || null,
    salaireSouhaite: Number.isFinite(salaire) && salaire > 0 ? (salaire < 1000 ? salaire * 1000 : salaire) : null,
  };

  // Un même e-mail = une seule fiche : le candidat qui revient met à jour son profil (vivier réutilisé)
  const existant = await prisma.candidat.findUnique({ where: { id: session.candidatId } });
  if (cv && existant) await supprimerAncienCv(existant.id);
  const champsCv = cv ? await donneesCv({ nom: cv.nom, type: cv.type, data: new Uint8Array(cv.data) }) : null;
  if (offre && existant && (await prisma.candidature.findFirst({ where: { candidatId: existant.id, offreId: offre.id } }))) {
    return NextResponse.json({ erreur: "Vous avez déjà postulé à cette offre. Suivez-la depuis votre espace candidat." }, { status: 400 });
  }
  const retour = !!existant;
  const candidat = existant
    ? await prisma.candidat.update({
        where: { id: existant.id },
        data: {
          ...Object.fromEntries(Object.entries(champs).filter(([, v]) => v !== null && v !== "")),
          metier,
          competences: competences.length ? competences : existant.competences,
          dernierContact: new Date(),
          consentementAt: new Date(),
          scoreTest: test ? test.score : existant.scoreTest,
          ...(["VIVIER", "NON_RETENU", "A_CONTACTER"].includes(existant.statut) ? { statut: "NOUVEAU" } : {}),
          ...(champsCv ?? {}),
        },
      })
    : await prisma.candidat.create({
        data: {
          ...champs, email, metier, competences, source,
          consentementAt: new Date(),
          scoreTest: test ? test.score : null,
          ...(champsCv ?? {}),
        },
      });

  await prisma.candidature.create({
    data: {
      candidatId: candidat.id,
      offreId: offre?.id ?? null,
      missionId: offre?.missionId ?? null,
      source,
      questionnaire: cle,
      reponses: test ? reponses : undefined,
      axes: test ? test.axes : undefined,
      scoreTest: test ? test.score : null,
      aRelire: test ? test.aRelire : false,
      dureeTestSec: test ? Math.min(7200, Math.max(0, parseInt(texte("dureeTestSec", 6), 10) || 0)) || null : null,
    },
  });
  if (!retour) await planifierRelances(candidat.id);

  recents.push(maintenant);
  envois.set(ip, recents);

  // E-mails : jamais bloquants
  await Promise.all([
    envoyerMail({
      a: email,
      sujet: "Nous avons bien reçu votre candidature",
      titre: `Merci ${prenom} !`,
      lignes: [
        offre ? `Votre candidature pour « ${offre.titre} » est bien arrivée chez FRANEO RH.` : "Votre CV est bien arrivé chez FRANEO RH.",
        "Un consultant l'étudie et revient vers vous rapidement. Vos données ne sont partagées avec un client qu'avec votre accord.",
      ],
    }),
    notifierAdmin({
      sujet: offre ? `Nouvelle candidature — ${offre.titre}` : "Nouveau CV spontané",
      titre: offre ? `📩 Candidature : ${offre.titre}` : "📩 Dépôt de CV spontané",
      lignes: [`${prenom} ${nom} · ${email}`, `Métier : ${metier}${retour ? " (candidat déjà dans la CVthèque)" : ""}`, ...(test ? [`Score du questionnaire : ${test.score}/100${test.aRelire ? " · réponse libre à relire" : ""}`] : [])],
      lien: `/admin/candidats/${candidat.id}`,
    }),
  ]);

  return NextResponse.json({ succes: true });
}
