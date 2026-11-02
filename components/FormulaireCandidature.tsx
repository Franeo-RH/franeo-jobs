"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DISPONIBILITES, NIVEAUX, TELETRAVAIL } from "@/lib/constantes";
import Domino from "@/components/Domino";

type QuestionPublique = { type: "qcm" | "echelle" | "libre"; partie: "tech" | "logique" | "dominos" | "profil"; q: string; options?: string[]; dominos?: [number, number][] };
type QuestionnairePublic = { cle: string; nom: string; dureeMin: number; questions: QuestionPublique[] } | null;

const PARTIES: { code: QuestionPublique["partie"]; titre: string; aide?: string }[] = [
  { code: "tech", titre: "Questions techniques" },
  { code: "logique", titre: "Logique et raisonnement" },
  { code: "dominos", titre: "Test de dominos", aide: "Chaque moitié du domino suit sa propre règle. Les valeurs vont de 0 à 6 : après 6, on revient à 0." },
  { code: "profil", titre: "Mises en situation" },
];

type Props = {
  offre: { id: string; titre: string; categorie: string } | null;
  cleFixe: string | null;
  questionnaires: Record<string, QuestionnairePublic>;
  parCategorie: Record<string, string>;
  categories: string[];
  source: string;
  questionnaireDeLOffre: string | null;
  profil: Partial<Record<"prenom" | "nom" | "email" | "telephone" | "ville" | "linkedin" | "metier" | "poste" | "experience" | "niveau" | "disponibilite" | "mobilite" | "teletravail" | "salaireSouhaite" | "preavis" | "competences", string>> & { aDejaCv?: boolean };
};

const champ = "w-full border rounded-lg px-4 py-3 text-black bg-white";
const etiquette = "block text-sm font-semibold mb-1";

/**
 * Formulaire public (sans compte) : informations + CV, puis questionnaire de présélection adapté au poste,
 * puis confirmation. Sert à postuler à une offre et à déposer un CV spontané.
 */
export default function FormulaireCandidature({ offre, cleFixe, questionnaires, parCategorie, categories, source, profil }: Props) {
  const [etape, setEtape] = useState<"infos" | "test" | "fait">("infos");
  const p = profil;
  const [f, setF] = useState({
    prenom: p.prenom ?? "", nom: p.nom ?? "", email: p.email ?? "", telephone: p.telephone ?? "", ville: p.ville ?? "", linkedin: p.linkedin ?? "",
    metier: offre?.categorie ?? p.metier ?? "", poste: offre?.titre ?? p.poste ?? "", experience: p.experience ?? "", niveau: p.niveau ?? "",
    disponibilite: p.disponibilite ?? "", mobilite: p.mobilite ?? "", teletravail: p.teletravail ?? "", salaireSouhaite: p.salaireSouhaite ?? "",
    preavis: p.preavis ?? "", competences: p.competences ?? "", siteWeb: "",
  });
  const [consentement, setConsentement] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [reponses, setReponses] = useState<(number | string | null)[]>([]);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [debutTest, setDebutTest] = useState<number | null>(null);
  const [ecoule, setEcoule] = useState(0);

  // Chronomètre indicatif pendant le questionnaire (le temps passé est transmis au consultant)
  useEffect(() => {
    if (etape !== "test" || debutTest === null) return;
    const id = window.setInterval(() => setEcoule(Math.round((Date.now() - debutTest) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [etape, debutTest]);

  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  // Questionnaire : celui de l'offre, ou celui du métier choisi pour un dépôt spontané
  const cle = offre ? cleFixe : f.metier ? parCategorie[f.metier] ?? "tech" : null;
  const questionnaire = cle ? questionnaires[cle] ?? null : null;

  function choisirCv(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0] ?? null;
    if (fichier && fichier.size > 5 * 1024 * 1024) {
      setErreur("Le CV dépasse 5 Mo.");
      e.target.value = "";
      return;
    }
    setErreur("");
    setCv(fichier);
  }

  async function envoyer(rep: (number | string | null)[]) {
    setEnvoi(true);
    setErreur("");
    const data = new FormData();
    Object.entries(f).forEach(([k, v]) => data.append(k, v));
    if (offre) data.append("offreId", offre.id);
    if (source) data.append("source", source);
    if (consentement) data.append("consentement", "on");
    if (cv) data.append("cv", cv);
    data.append("reponses", JSON.stringify(rep));
    if (debutTest !== null) data.append("dureeTestSec", String(Math.round((Date.now() - debutTest) / 1000)));
    try {
      const res = await fetch("/api/candidature", { method: "POST", body: data });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(d.erreur || "L'envoi a échoué. Réessayez.");
        setEnvoi(false);
        return;
      }
      setEtape("fait");
    } catch {
      setErreur("Problème de connexion, réessayez.");
    }
    setEnvoi(false);
  }

  function validerInfos(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (!offre && !f.metier) return setErreur("Choisissez votre métier.");
    if (!consentement) return setErreur("Cochez la case de consentement pour continuer.");
    if (!offre && !cv && !profil.aDejaCv) return setErreur("Ajoutez votre CV (PDF ou Word) pour déposer votre candidature.");
    if (questionnaire) {
      setReponses(new Array(questionnaire.questions.length).fill(null));
      if (debutTest === null) setDebutTest(Date.now());
      setEtape("test");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      envoyer([]);
    }
  }

  function validerTest(e: React.FormEvent) {
    e.preventDefault();
    if (!questionnaire) return;
    const manque = questionnaire.questions.some((q, i) => q.type !== "libre" && (reponses[i] === null || reponses[i] === undefined));
    if (manque) return setErreur("Répondez à toutes les questions à choix pour envoyer votre candidature.");
    envoyer(reponses);
  }

  const poser = (i: number, v: number | string) => setReponses((r) => r.map((x, j) => (j === i ? v : x)));

  if (etape === "fait") {
    return (
      <div className="text-center py-8">
        <p className="text-5xl mb-3">✅</p>
        <h3 className="text-2xl font-bold">Merci {f.prenom} !</h3>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          {offre ? `Votre candidature pour « ${offre.titre} » est bien arrivée.` : "Votre CV est bien arrivé dans notre CVthèque."} Un consultant FRANEO RH l&apos;étudie et revient vers vous rapidement. Un e-mail de confirmation vous a été envoyé.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mt-6">
          <Link href="/candidat" className="fr-bouton-violet">Suivre ma candidature</Link>
          <Link href="/offres" className="bg-gray-100 text-gray-800 px-5 py-3 rounded-lg font-semibold">Voir les autres offres</Link>
        </div>
      </div>
    );
  }

  if (etape === "test" && questionnaire) {
    return (
      <form onSubmit={validerTest}>
        <div className="rounded-lg bg-violet-50 text-violet-900 px-4 py-3 mb-6">
          <div className="flex justify-between gap-3 flex-wrap">
            <p className="font-bold">Questionnaire de présélection · environ {questionnaire.dureeMin} minutes</p>
            <p className="font-mono font-bold" aria-live="off" title="Temps écoulé">⏱ {String(Math.floor(ecoule / 60)).padStart(2, "0")}:{String(ecoule % 60).padStart(2, "0")}</p>
          </div>
          <p className="text-sm mt-1">{reponses.filter((r) => r !== null && r !== "").length} / {questionnaire.questions.length} réponses</p>
          <p className="text-sm mt-1">Il n&apos;y a pas de piège : répondez comme vous travaillez. Il aide le consultant à mieux comprendre votre profil.</p>
        </div>
        {PARTIES.map((p) => {
          const indices = questionnaire.questions.map((q, i) => ({ q, i })).filter((x) => x.q.partie === p.code);
          if (indices.length === 0) return null;
          const numero = PARTIES.filter((x) => questionnaire.questions.some((q) => q.partie === x.code)).findIndex((x) => x.code === p.code) + 1;
          return (
            <div key={p.code} className="mb-6">
              <h3 className="text-lg font-bold text-violet-700 mb-1">Partie {numero} · {p.titre}</h3>
              {p.aide && <p className="text-sm text-gray-600 mb-3">{p.aide}</p>}
              {indices.map(({ q, i }, n) => (
                <fieldset key={i} className="border rounded-xl p-4 mb-3">
                  <legend className="px-2 font-semibold">{n + 1}. {q.q}</legend>
                  {q.dominos && (
                    <div className="flex gap-2 flex-wrap items-center my-3">
                      {q.dominos.map(([h, b], k) => <Domino key={k} haut={h} bas={b} />)}
                      <Domino vide />
                    </div>
                  )}
                  {q.type === "qcm" && q.dominos && (
                    <div className="flex gap-3 flex-wrap mt-2" role="radiogroup">
                      {q.options?.map((o, j) => {
                        const [h, b] = o.split("|").map(Number);
                        return (
                          <button key={j} type="button" role="radio" aria-checked={reponses[i] === j} onClick={() => poser(i, j)} className="flex flex-col items-center gap-1">
                            <Domino haut={h} bas={b} actif={reponses[i] === j} />
                            <span className="text-xs text-gray-500">{String.fromCharCode(65 + j)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {q.type === "qcm" && !q.dominos && q.options?.map((o, j) => (
                    <label key={j} className="flex items-start gap-3 py-2 cursor-pointer">
                      <input type="radio" name={`q${i}`} checked={reponses[i] === j} onChange={() => poser(i, j)} className="mt-1 accent-violet-600" />
                      <span>{o}</span>
                    </label>
                  ))}
                  {q.type === "echelle" && (
                    <div>
                      <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button key={v} type="button" onClick={() => poser(i, v)} aria-pressed={reponses[i] === v}
                            className={`w-12 h-12 rounded-lg font-bold border ${reponses[i] === v ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-700"}`}>{v}</button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">1 = pas du tout d&apos;accord · 5 = tout à fait d&apos;accord</p>
                    </div>
                  )}
                  {q.type === "libre" && (
                    <textarea rows={4} className={champ} placeholder="Votre réponse (quelques lignes)" value={typeof reponses[i] === "string" ? (reponses[i] as string) : ""} onChange={(e) => poser(i, e.target.value)} />
                  )}
                </fieldset>
              ))}
            </div>
          );
        })}
        {erreur && <p className="text-red-600 mb-3" role="alert">{erreur}</p>}
        <div className="flex gap-3 flex-wrap">
          <button type="button" onClick={() => { setEtape("infos"); setErreur(""); }} className="bg-gray-100 text-gray-800 px-5 py-3 rounded-lg font-semibold">← Retour</button>
          <button type="submit" disabled={envoi} className="fr-bouton-violet">{envoi ? "Envoi en cours…" : "Envoyer ma candidature"}</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={validerInfos} className="flex flex-col gap-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div><label htmlFor="prenom" className={etiquette}>Prénom *</label><input id="prenom" className={champ} value={f.prenom} onChange={maj("prenom")} required autoComplete="given-name" /></div>
        <div><label htmlFor="nom" className={etiquette}>Nom *</label><input id="nom" className={champ} value={f.nom} onChange={maj("nom")} required autoComplete="family-name" /></div>
        <div><label htmlFor="email" className={etiquette}>E-mail *</label><input id="email" type="email" className={`${champ} bg-gray-100`} value={f.email} readOnly title="L'adresse de votre espace candidat" /></div>
        <div><label htmlFor="telephone" className={etiquette}>Téléphone</label><input id="telephone" type="tel" className={champ} value={f.telephone} onChange={maj("telephone")} autoComplete="tel" /></div>
        <div><label htmlFor="ville" className={etiquette}>Ville</label><input id="ville" className={champ} value={f.ville} onChange={maj("ville")} autoComplete="address-level2" /></div>
        <div><label htmlFor="linkedin" className={etiquette}>Profil LinkedIn</label><input id="linkedin" className={champ} value={f.linkedin} onChange={maj("linkedin")} placeholder="Lien facultatif" /></div>
        {!offre && (
          <>
            <div><label htmlFor="metier" className={etiquette}>Votre métier *</label>
              <select id="metier" className={champ} value={f.metier} onChange={maj("metier")} required>
                <option value="">Choisir…</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select></div>
            <div><label htmlFor="poste" className={etiquette}>Poste recherché</label><input id="poste" className={champ} value={f.poste} onChange={maj("poste")} placeholder="Ex. Gestionnaire de paie" /></div>
          </>
        )}
        <div><label htmlFor="experience" className={etiquette}>Expérience</label><input id="experience" className={champ} value={f.experience} onChange={maj("experience")} placeholder="Ex. 5 ans" /></div>
        <div><label htmlFor="niveau" className={etiquette}>Niveau d&apos;études</label>
          <select id="niveau" className={champ} value={f.niveau} onChange={maj("niveau")}><option value="">Choisir…</option>{NIVEAUX.map((n) => <option key={n}>{n}</option>)}</select></div>
        <div><label htmlFor="disponibilite" className={etiquette}>Disponibilité</label>
          <select id="disponibilite" className={champ} value={f.disponibilite} onChange={maj("disponibilite")}><option value="">Choisir…</option>{DISPONIBILITES.map((n) => <option key={n}>{n}</option>)}</select></div>
        <div><label htmlFor="preavis" className={etiquette}>Préavis</label><input id="preavis" className={champ} value={f.preavis} onChange={maj("preavis")} placeholder="Ex. 1 mois, aucun" /></div>
        <div><label htmlFor="mobilite" className={etiquette}>Mobilité géographique</label><input id="mobilite" className={champ} value={f.mobilite} onChange={maj("mobilite")} placeholder="Ex. Nancy et 30 km autour" /></div>
        <div><label htmlFor="teletravail" className={etiquette}>Télétravail accepté</label>
          <select id="teletravail" className={champ} value={f.teletravail} onChange={maj("teletravail")}><option value="">Choisir…</option>{TELETRAVAIL.map((n) => <option key={n}>{n}</option>)}</select></div>
        <div><label htmlFor="salaireSouhaite" className={etiquette}>Salaire souhaité (€ brut / an)</label><input id="salaireSouhaite" inputMode="numeric" className={champ} value={f.salaireSouhaite} onChange={maj("salaireSouhaite")} placeholder="Ex. 38000" /></div>
      </div>
      <div><label htmlFor="competences" className={etiquette}>Compétences clés (séparées par des virgules)</label><input id="competences" className={champ} value={f.competences} onChange={maj("competences")} placeholder="Ex. Paie, DSN, Silae" /></div>

      <div>
        <label htmlFor="cv" className={etiquette}>{profil.aDejaCv ? "Nouveau CV (facultatif : votre CV actuel sera utilisé sinon)" : `Votre CV (PDF ou Word, 5 Mo max)${!offre ? " *" : ""}`}</label>
        <input id="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={choisirCv}
          className="w-full border-2 border-dashed rounded-lg px-4 py-4 bg-gray-50" />
      </div>

      {/* Champ piège pour les robots : invisible pour les personnes */}
      <input type="text" name="siteWeb" tabIndex={-1} autoComplete="off" value={f.siteWeb} onChange={maj("siteWeb")} aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} />

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-1 accent-violet-600" />
        <span className="text-sm text-gray-700">J&apos;accepte que FRANEO RH conserve ma candidature 24 mois et me contacte pour des missions correspondant à mon profil. <Link href="/confidentialite" target="_blank" className="text-violet-700 underline">En savoir plus</Link></span>
      </label>

      {erreur && <p className="text-red-600" role="alert">{erreur}</p>}
      <div>
        <button type="submit" disabled={envoi} className="fr-bouton-violet">
          {envoi ? "Envoi en cours…" : questionnaire ? "Continuer vers le questionnaire →" : "Envoyer ma candidature"}
        </button>
        {questionnaire && <p className="text-xs text-gray-500 mt-2">Étape suivante : un court questionnaire d&apos;environ {questionnaire.dureeMin} minutes.</p>}
      </div>
    </form>
  );
}
