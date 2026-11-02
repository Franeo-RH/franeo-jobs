"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import InstallerApp from "@/components/InstallerApp";
import { viderCacheHorsLigne } from "@/components/EnregistrerSW";
import DemandeAcces from "@/components/DemandeAcces";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [chargementDemo, setChargementDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErreur(data.erreur);
      setChargement(false);
      return;
    }
    await viderCacheHorsLigne(); // nouvelle session : on repart d'un cache vide
    router.push(data.role === "ADMIN" ? "/admin/dashboard" : data.role === "CANDIDAT" ? "/candidat" : "/client/dashboard");
  }

  async function testerLaDemo() {
    setChargementDemo(true);
    setErreur("");
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur || "La démo est indisponible pour le moment.");
        setChargementDemo(false);
        return;
      }
      await viderCacheHorsLigne();
      router.push("/client/dashboard");
    } catch {
      setErreur("Problème de connexion, réessayez.");
      setChargementDemo(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow p-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image src="/FRANEO-Logo-Violet.png" alt="Franeo Jobs" width={130} height={102} style={{ objectFit: "contain" }} />
        </div>

        <p className="text-gray-500 text-center mb-8">Espace client et espace recruteur de FRANEO RH.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-4 py-3 text-black" placeholder="votre@email.fr" required autoComplete="username" />
          </div>
          <div>
            <label htmlFor="mdp" className="block text-sm font-semibold mb-1">Mot de passe</label>
            <input id="mdp" type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className="w-full border rounded-lg px-4 py-3 text-black" placeholder="••••••••" required autoComplete="current-password" />
          </div>
          <div className="text-right">
            <Link href="/mot-de-passe-oublie" className="text-violet-700 text-sm hover:underline">Mot de passe oublié ?</Link>
          </div>
          {erreur && <p className="text-red-500 text-sm" role="alert">{erreur}</p>}
          <button type="submit" disabled={chargement} className="bg-violet-600 text-white rounded-lg py-3 font-semibold mt-2 hover:bg-violet-700 transition">
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 border-t" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 border-t" />
        </div>

        <button type="button" onClick={testerLaDemo} disabled={chargementDemo} className="w-full border-2 border-violet-600 text-violet-700 rounded-lg py-3 font-semibold hover:bg-violet-50 transition disabled:opacity-60">
          {chargementDemo ? "Ouverture de la démo..." : "🧪 Tester la démo client"}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">Sans inscription, avec des candidats fictifs : consultez un dossier et donnez votre retour.</p>

        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <DemandeAcces variante="lien" />
        </div>

        <div className="text-center mt-4">
          <Link href="/offres" className="text-sm text-gray-500 hover:text-violet-700">Vous cherchez un emploi ? Voir les offres →</Link>
        </div>

        <InstallerApp style={{ width: "100%", marginTop: "16px", background: "#111827", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 600, cursor: "pointer" }} />
      </div>
    </main>
  );
}
