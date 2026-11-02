"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PagePublique } from "@/components/PublicBarre";

const champ = "w-full border rounded-lg px-4 py-3 text-black bg-white";

function Contenu() {
  const router = useRouter();
  const sp = useSearchParams();
  const expire = sp.get("lien") === "expire";
  const r = sp.get("retour") || "";
  const retour = r.startsWith("/") && !r.startsWith("//") ? r : "/candidat"; // uniquement une page du site
  const [mode, setMode] = useState<"connexion" | "inscription">(sp.get("mode") === "inscription" ? "inscription" : "connexion");
  const [f, setF] = useState({ prenom: "", nom: "", email: "", motDePasse: "", siteWeb: "" });
  const [consentement, setConsentement] = useState(false);
  const [erreur, setErreur] = useState(expire ? "Ce lien d'activation a expiré : recréez votre espace pour en recevoir un nouveau." : "");
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);
  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    if (mode === "connexion") {
      const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email, motDePasse: f.motDePasse }) });
      const d = await res.json().catch(() => ({}));
      setChargement(false);
      if (!res.ok) return setErreur("E-mail ou mot de passe incorrect, ou espace pas encore activé (vérifiez vos e-mails).");
      router.push(d.role === "CANDIDAT" ? retour : d.role === "ADMIN" ? "/admin/dashboard" : "/client/dashboard");
      return;
    }
    const res = await fetch("/api/candidat/inscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, consentement, retour }) });
    const d = await res.json().catch(() => ({}));
    setChargement(false);
    if (!res.ok) return setErreur(d.erreur || "La création a échoué.");
    setEnvoye(true);
  }

  return (
    <div className="bg-white rounded-xl shadow p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Mon espace candidat</h1>
      <p className="text-gray-500 mb-6">Suivez vos candidatures, vos résultats et mettez à jour votre profil.</p>
      {envoye ? (
        <div className="text-center py-4">
          <p className="text-4xl mb-2">📧</p>
          <p className="font-semibold">Vérifiez votre boîte mail</p>
          <p className="text-gray-600 mt-2">Si l&apos;adresse est valide, vous avez reçu un lien pour activer votre espace (valable 48 h). Pensez à regarder dans les courriers indésirables.</p>
        </div>
      ) : (
        <>
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6" role="tablist">
            {(["connexion", "inscription"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErreur(""); }}
                className={`flex-1 py-2 rounded-md font-semibold ${mode === m ? "bg-white shadow text-violet-700" : "text-gray-600"}`}>{m === "connexion" ? "Se connecter" : "Créer mon espace"}</button>
            ))}
          </div>
          <form onSubmit={envoyer} className="flex flex-col gap-4">
            {mode === "inscription" && (
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Prénom" value={f.prenom} onChange={maj("prenom")} className={champ} required autoComplete="given-name" />
                <input placeholder="Nom" value={f.nom} onChange={maj("nom")} className={champ} required autoComplete="family-name" />
              </div>
            )}
            <input type="email" placeholder="E-mail (celui de votre candidature)" value={f.email} onChange={maj("email")} className={champ} required autoComplete="email" />
            <input type="password" placeholder={mode === "inscription" ? "Mot de passe (8 caractères min.)" : "Mot de passe"} value={f.motDePasse} onChange={maj("motDePasse")} minLength={mode === "inscription" ? 8 : undefined} className={champ} required autoComplete={mode === "inscription" ? "new-password" : "current-password"} />
            <input type="text" value={f.siteWeb} onChange={maj("siteWeb")} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />
            {mode === "inscription" && (
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-1 accent-violet-600" />
                <span>J&apos;accepte que FRANEO RH conserve mes données 24 mois pour me proposer des missions. <Link href="/confidentialite" target="_blank" className="text-violet-700 underline">En savoir plus</Link></span>
              </label>
            )}
            {mode === "connexion" && <Link href="/mot-de-passe-oublie" className="text-sm text-violet-700 text-right hover:underline">Mot de passe oublié ?</Link>}
            {erreur && <p className="text-red-600 text-sm" role="alert">{erreur}</p>}
            <button type="submit" disabled={chargement} className="fr-bouton-violet">{chargement ? "…" : mode === "connexion" ? "Se connecter" : "Créer mon espace"}</button>
          </form>
          {mode === "inscription" && <p className="text-xs text-gray-500 mt-4">Vous avez déjà postulé ? Utilisez la même adresse e-mail : vos candidatures apparaîtront automatiquement.</p>}
        </>
      )}
    </div>
  );
}

export default function EspaceCandidat() {
  return <PagePublique><Suspense fallback={null}><Contenu /></Suspense></PagePublique>;
}
