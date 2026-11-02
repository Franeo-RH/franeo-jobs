"use client";

import { useRouter } from "next/navigation";

export default function BoutonDeconnexion() {
  const router = useRouter();
  return (
    <button type="button" onClick={async () => { await fetch("/api/logout", { method: "POST" }); router.push("/espace-candidat"); }}
      style={{ background: "none", border: "none", color: "#f87171", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>Déconnexion</button>
  );
}
