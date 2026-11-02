import Image from "next/image";
import Link from "next/link";
import Coquille from "@/components/Coquille";
import { getSession } from "@/lib/session";

/** Barre noire et pied de page des pages ouvertes à tous (candidats, sans compte) */
export function PublicBarre() {
  return (
    <header className="fr-public-barre">
      <Link href="/offres" aria-label="Franeo Jobs, accueil" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Image src="/FRANEO-Logo-Violet.png" alt="Franeo" width={52} height={41} style={{ objectFit: "contain" }} priority />
        <span style={{ color: "#c4b5fd", fontWeight: 800, fontSize: "13px", letterSpacing: "0.12em" }}>JOBS</span>
      </Link>
      <nav style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/offres">Offres d&apos;emploi</Link>
        <Link href="/candidature-spontanee">Déposer mon CV</Link>
        <Link href="/candidat">Mon espace candidat</Link>
        <Link href="/login" style={{ color: "#c4b5fd" }}>Espace client</Link>
      </nav>
    </header>
  );
}

export function PublicPied() {
  return (
    <footer className="text-center text-sm text-gray-500 py-8 px-4">
      <p>
        FRANEO RH · Cabinet de recrutement · <Link href="/confidentialite" className="text-violet-700 hover:underline">Confidentialité et données personnelles</Link>
      </p>
    </footer>
  );
}

/** Pages ouvertes à tous : même présentation que l'appli (barre noire, barre latérale, cartes) */
export async function PagePublique({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const session = s?.role === "CANDIDAT" ? { role: "CANDIDAT", prenom: s.prenom } : { role: "PUBLIC", prenom: "" };
  return <Coquille session={session} pied={<PublicPied />}>{children}</Coquille>;
}
