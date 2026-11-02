"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function Formulaire() {
  const token = useSearchParams().get("token") || "";
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [ok, setOk] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    const res = await fetch("/api/auth/reinitialiser-mot-de-passe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, motDePasse: mdp }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) setOk(true);
    else setErreur(d.erreur || "Impossible de changer le mot de passe.");
  }

  return (
    <div className="bg-white rounded-xl shadow p-10 w-full max-w-md">
      <h1 className="text-2xl font-bold mb-2">Nouveau mot de passe</h1>
      {ok ? (
        <p className="text-green-700 mt-4">Mot de passe modifié. <Link href="/login" className="underline">Se connecter</Link></p>
      ) : (
        <form onSubmit={envoyer} className="flex flex-col gap-4 mt-4">
          <label htmlFor="mdp" className="text-sm font-semibold">Nouveau mot de passe (8 caractères minimum)</label>
          <input id="mdp" type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} minLength={8} className="w-full border rounded-lg px-4 py-3 text-black" required autoComplete="new-password" />
          {erreur && <p className="text-red-600 text-sm" role="alert">{erreur}</p>}
          <button type="submit" className="bg-violet-600 text-white rounded-lg py-3 font-semibold hover:bg-violet-700 transition">Enregistrer</button>
        </form>
      )}
    </div>
  );
}

export default function ReinitialiserMotDePasse() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Suspense fallback={null}><Formulaire /></Suspense>
    </main>
  );
}
