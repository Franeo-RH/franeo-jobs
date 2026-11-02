"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import InstallerApp from "@/components/InstallerApp";
import BoutonTheme from "@/components/BoutonTheme";
import { viderCacheHorsLigne } from "@/components/EnregistrerSW";

// Adresse du site vitrine (modifiable avec la variable NEXT_PUBLIC_SITE_URL sur Vercel)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://franeo-rh.com";

interface NavbarProps {
  role: "ADMIN" | "CLIENT" | "CANDIDAT" | "PUBLIC";
  prenom: string;
}

type Lien = { href: string; label: string; icon: string; actifSur?: string[] };

export default function Navbar({ role, prenom }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [chargement, setChargement] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);

  // Ferme le menu téléphone à chaque changement de page
  useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  // Téléphone : chaque cellule de tableau reçoit le nom de sa colonne,
  // ce qui permet d'afficher les tableaux sous forme de liste (voir globals.css)
  useEffect(() => {
    function etiqueter() {
      document.querySelectorAll("main table").forEach((table) => {
        const titres = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent || "").trim());
        if (titres.length === 0) return;
        table.querySelectorAll("tbody tr").forEach((tr) => {
          Array.from(tr.children).forEach((td, i) => {
            const label = titres[i] ?? "";
            if (td.getAttribute("data-label") !== label) td.setAttribute("data-label", label);
          });
        });
      });
    }
    etiqueter();
    const obs = new MutationObserver(() => etiqueter());
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [pathname]);

  async function handleLogout() {
    setChargement(true);
    await viderCacheHorsLigne(); // les pages gardées pour le hors-ligne ne restent pas sur l'appareil
    await fetch("/api/logout", { method: "POST" });
    router.push(role === "CANDIDAT" ? "/espace-candidat" : "/login");
    router.refresh();
  }

  const liens: Lien[] = role === "ADMIN"
    ? [
        { href: "/admin/dashboard", label: "Dashboard", icon: "/DASHBOARD-LOGO.png" },
        { href: "/admin/clients", label: "Clients", icon: "/ENTREPRISE-LOGO.png" },
        { href: "/admin/missions", label: "Missions", icon: "/TICKET-LOGO.png", actifSur: ["/admin/pipeline", "/admin/matching"] },
        { href: "/admin/offres", label: "Offres", icon: "/COMMUNICATION-LOGO.png", actifSur: ["/admin/questionnaires", "/admin/sourcing"] },
        { href: "/admin/candidats", label: "Candidats", icon: "/SALARIE-LOGO.png", actifSur: ["/admin/relances"] },
        { href: "/admin/presentations", label: "Présentations", icon: "/HELPDESK-LOGO.png" },
        { href: "/admin/facturation", label: "Facturation", icon: "/PAIE-LOGO.png" },
        { href: "/admin/parametres", label: "Paramètres", icon: "/FAQ-LOGO.png" },
      ]
    : role === "PUBLIC"
    ? [
        { href: "/offres", label: "Offres", icon: "/COMMUNICATION-LOGO.png" },
        { href: "/candidature-spontanee", label: "Déposer mon CV", icon: "/ACTUALITE-LOGO.png" },
        { href: "/espace-candidat", label: "Espace candidat", icon: "/SALARIE-LOGO.png" },
        { href: "/login", label: "Espace client", icon: "/ENTREPRISE-LOGO.png" },
      ]
    : role === "CANDIDAT"
    ? [
        { href: "/candidat", label: "Mon suivi", icon: "/DASHBOARD-LOGO.png" },
        { href: "/candidat/profil", label: "Mes infos", icon: "/SALARIE-LOGO.png" },
        { href: "/offres", label: "Offres", icon: "/COMMUNICATION-LOGO.png" },
        { href: "/candidature-spontanee", label: "Déposer mon CV", icon: "/ACTUALITE-LOGO.png" },
      ]
    : [
        { href: "/client/dashboard", label: "Dashboard", icon: "/DASHBOARD-LOGO.png" },
        { href: "/client/missions", label: "Missions", icon: "/TICKET-LOGO.png" },
        { href: "/client/candidats", label: "Candidats", icon: "/SALARIE-LOGO.png" },
        { href: "/client/echanges", label: "Échanges", icon: "/COMMUNICATION-LOGO.png" },
      ];

  const sousChemin = (h: string) => pathname === h || pathname.startsWith(h + "/");
  // Le lien le plus précis gagne
  const actif = (l: Lien) => {
    if ((l.actifSur || []).some(sousChemin)) return true;
    if (!sousChemin(l.href)) return false;
    return !liens.some((autre) => autre !== l && (autre.actifSur || []).some(sousChemin));
  };

  const profil = (
    <>
      {role === "CLIENT" && <Link href="/client/profil" className="fr-nav-petit">🔒 Mot de passe</Link>}
      {(role === "ADMIN" || role === "CLIENT") && <Link href="/offres" className="fr-nav-petit">💼 Voir les offres publiques</Link>}
      {role === "PUBLIC" && <Link href="/espace-candidat" className="fr-nav-petit">🔑 Se connecter</Link>}
      <Link href="/installer" className="fr-nav-petit">📲 Installer l&apos;app</Link>
      <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="fr-nav-petit">🌐 Site Franeo ↗</a>
      <BoutonTheme className="fr-nav-theme" />
      {role !== "PUBLIC" && (
        <button onClick={handleLogout} disabled={chargement} className="fr-nav-deco">
          {chargement ? "..." : "Déconnexion"}
        </button>
      )}
    </>
  );

  return (
    <nav className="fr-nav">
      <div className="fr-nav-barre">
        <Link href={{ ADMIN: "/admin/dashboard", CLIENT: "/client/dashboard", CANDIDAT: "/candidat", PUBLIC: "/offres" }[role]} className="fr-nav-logo" aria-label="Accueil Franeo Jobs">
          <Image src="/FRANEO-Logo-Violet.png" alt="Franeo Jobs" width={52} height={41} style={{ objectFit: "contain" }} priority />
          <span style={{ color: "#c4b5fd", fontWeight: 800, fontSize: "13px", letterSpacing: "0.12em", marginLeft: "10px" }}>JOBS</span>
        </Link>

        {/* Ordinateur : onglets centrés */}
        <div className="fr-nav-liens">
          {liens.map((lien) => (
            <Link key={lien.href} href={lien.href} className={`fr-nav-lien${actif(lien) ? " fr-actif" : ""}`}>
              <Image src={lien.icon} alt="" width={18} height={18} className="invert" style={{ objectFit: "contain" }} />
              <span>{lien.label}</span>
            </Link>
          ))}
        </div>

        <div className="fr-nav-profil">
          <span className="fr-nav-prenom">{role === "PUBLIC" ? "Bienvenue" : prenom || " "}</span>
          {profil}
        </div>

        {/* Téléphone : bouton menu */}
        <button
          type="button"
          className="fr-burger"
          aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOuvert}
          onClick={() => setMenuOuvert((o) => !o)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOuvert ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Téléphone : menu déroulant */}
      {menuOuvert && (
        <div className="fr-menu-mobile">
          <div className="fr-menu-grille">
            {liens.map((lien) => (
              <Link key={lien.href} href={lien.href} className={`fr-menu-lien${actif(lien) ? " fr-actif" : ""}`}>
                <Image src={lien.icon} alt="" width={22} height={22} className="invert" style={{ objectFit: "contain" }} />
                <span>{lien.label}</span>
              </Link>
            ))}
          </div>
          <InstallerApp className="fr-menu-installer" />
          <div className="fr-menu-pied">
            <span>👤 {role === "PUBLIC" ? "Visiteur" : prenom}</span>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>{profil}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
