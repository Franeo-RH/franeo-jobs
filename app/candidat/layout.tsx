import Image from "next/image";
import Link from "next/link";
import { exigerCandidat } from "@/lib/session";
import { PublicPied } from "@/components/PublicBarre";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";

export const dynamic = "force-dynamic";

export default async function CandidatLayout({ children }: { children: React.ReactNode }) {
  const s = await exigerCandidat();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="fr-public-barre">
        <Link href="/candidat" aria-label="Mon espace candidat" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image src="/FRANEO-Logo-Violet.png" alt="Franeo" width={52} height={41} style={{ objectFit: "contain" }} priority />
          <span style={{ color: "#c4b5fd", fontWeight: 800, fontSize: "13px", letterSpacing: "0.12em" }}>JOBS</span>
        </Link>
        <nav style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/candidat">📍 Mon suivi</Link>
          <Link href="/candidat/profil">👤 Mes informations</Link>
          <Link href="/offres">💼 Offres</Link>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px" }}>{s.prenom}</span>
          <BoutonDeconnexion />
        </nav>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">{children}</main>
      <PublicPied />
    </div>
  );
}
