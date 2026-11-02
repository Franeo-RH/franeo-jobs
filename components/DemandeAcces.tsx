"use client";

import { useState } from "react";

/** Bouton + formulaire « Demander mon accès / Nous contacter » (démo et page de connexion) */
export default function DemandeAcces({ variante = "bandeau" }: { variante?: "bandeau" | "lien" }) {
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<"INSCRIPTION" | "CONTACT">("INSCRIPTION");
  const [f, setF] = useState({ societe: "", prenom: "", nom: "", email: "", telephone: "", message: "", siteWeb: "" });
  const [envoi, setEnvoi] = useState(false);
  const [etat, setEtat] = useState<{ ok: boolean; texte: string } | null>(null);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    const res = await fetch("/api/inscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, type }) });
    const d = await res.json().catch(() => ({}));
    setEnvoi(false);
    setEtat(res.ok ? { ok: true, texte: "✅ Merci ! FRANEO RH vous recontacte très vite." } : { ok: false, texte: `❌ ${d.erreur || "Envoi impossible"}` });
  }

  const champ: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: "8px", padding: "9px 10px", fontSize: "16px", color: "#111827", background: "#ffffff" };
  const ouvrir = (t: "INSCRIPTION" | "CONTACT") => { setType(t); setEtat(null); setOuvert(true); };
  const maj = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      {variante === "bandeau" ? (
        <span style={{ display: "inline-flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" onClick={() => ouvrir("INSCRIPTION")} style={{ background: "#ffffff", color: "#6d28d9", border: "none", borderRadius: "999px", padding: "7px 16px", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>
            🚀 Demander mon accès
          </button>
          <button type="button" onClick={() => ouvrir("CONTACT")} style={{ background: "rgba(255,255,255,0.18)", color: "#ffffff", border: "none", borderRadius: "999px", padding: "7px 16px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
            ✉️ Nous contacter
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => ouvrir("INSCRIPTION")} style={{ background: "none", border: "none", color: "#6d28d9", fontWeight: 700, fontSize: "14px", cursor: "pointer", textDecoration: "underline" }}>
          Pas encore client ? Demander un accès
        </button>
      )}

      {ouvert && (
        <div role="dialog" aria-modal="true" aria-label="Demande d'accès" onClick={() => setOuvert(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", color: "#111827", borderRadius: "16px", padding: "20px", width: "100%", maxWidth: "480px", maxHeight: "92vh", overflowY: "auto", textAlign: "left" }}>
            <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", borderRadius: "10px", padding: "4px", marginBottom: "14px" }}>
              {(["INSCRIPTION", "CONTACT"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} style={{ flex: 1, border: "none", borderRadius: "8px", padding: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer", background: type === t ? "#ffffff" : "transparent", color: type === t ? "#6d28d9" : "#6b7280" }}>
                  {t === "INSCRIPTION" ? "🚀 Demander mon accès" : "✉️ Être recontacté"}
                </button>
              ))}
            </div>
            {etat?.ok ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#15803d" }}>{etat.texte}</p>
                <button type="button" onClick={() => setOuvert(false)} style={{ marginTop: "10px", background: "#111827", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>Fermer</button>
              </div>
            ) : (
              <form onSubmit={envoyer} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input style={champ} placeholder="Société *" value={f.societe} onChange={maj("societe")} required />
                <div style={{ display: "flex", gap: "8px" }}>
                  <input style={champ} placeholder="Prénom *" value={f.prenom} onChange={maj("prenom")} required />
                  <input style={champ} placeholder="Nom *" value={f.nom} onChange={maj("nom")} required />
                </div>
                <input style={champ} type="email" placeholder="E-mail *" value={f.email} onChange={maj("email")} required />
                <input style={champ} placeholder="Téléphone" value={f.telephone} onChange={maj("telephone")} />
                <textarea style={{ ...champ, minHeight: "80px" }} placeholder="Votre besoin de recrutement (poste, lieu, délai…)" value={f.message} onChange={maj("message")} />
                <input style={{ display: "none" }} tabIndex={-1} autoComplete="off" value={f.siteWeb} onChange={maj("siteWeb")} aria-hidden="true" />
                {etat && !etat.ok && <p style={{ color: "#b91c1c", fontSize: "14px", margin: 0 }}>{etat.texte}</p>}
                <button type="submit" disabled={envoi} style={{ background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer", opacity: envoi ? 0.6 : 1 }}>
                  {envoi ? "Envoi…" : "Envoyer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
