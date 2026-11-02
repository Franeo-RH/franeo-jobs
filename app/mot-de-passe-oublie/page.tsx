"use client";

import { useState } from "react";
import Link from "next/link";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    await fetch("/api/auth/mot-de-passe-oublie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setChargement(false);
    setEnvoye(true);
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Mot de passe oublié</h1>
        {envoye ? (
          <p className="text-gray-600 mt-4">Si cette adresse correspond à un compte, vous recevrez un e-mail avec un lien valable 1 heure.</p>
        ) : (
          <form onSubmit={envoyer} className="flex flex-col gap-4 mt-4">
            <label htmlFor="email" className="text-sm font-semibold">Votre adresse e-mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-3 text-black" required />
            <button type="submit" disabled={chargement} className="bg-violet-600 text-white rounded-lg py-3 font-semibold hover:bg-violet-700 transition">{chargement ? "Envoi…" : "Recevoir le lien"}</button>
          </form>
        )}
        <Link href="/login" className="block text-center text-violet-700 text-sm mt-6 hover:underline">← Retour à la connexion</Link>
      </div>
    </main>
  );
}
