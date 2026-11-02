"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Role = "ADMIN" | "CLIENT" | "CANDIDAT" | "PUBLIC";
type Item = { href: string; label: string; badge?: number; aussi?: string[] };

/** Liste des liens de la barre latérale selon l'onglet ouvert */
function rubrique(pathname: string, role: Role): { titre: string; items: Item[] } | null {
  const dans = (...mots: string[]) => mots.some((m) => pathname.includes(m));

  if (role === "PUBLIC") {
    return { titre: "Franeo Jobs", items: [
      { href: "/offres", label: "💼 Offres d'emploi" },
      { href: "/candidature-spontanee", label: "📄 Déposer mon CV" },
      { href: "/espace-candidat", label: "👤 Mon espace candidat" },
      { href: "/confidentialite", label: "🛡️ Données personnelles" },
    ] };
  }
  if (role === "CANDIDAT") {
    return { titre: "Mon espace", items: [
      { href: "/candidat", label: "📍 Mon suivi" },
      { href: "/candidat/profil", label: "👤 Mes informations" },
      { href: "/offres", label: "💼 Offres d'emploi" },
      { href: "/candidature-spontanee", label: "📄 Déposer mon CV" },
    ] };
  }

  if (role === "ADMIN") {
    if (dans("/admin/clients")) {
      return { titre: "Clients", items: [
        { href: "/admin/clients", label: "🏢 Liste des clients" },
        { href: "/admin/clients/nouveau", label: "➕ Ajouter un client" },
      ] };
    }
    if (dans("/admin/missions", "/admin/pipeline", "/admin/matching")) {
      return { titre: "Missions", items: [
        { href: "/admin/missions", label: "📋 Liste des missions" },
        { href: "/admin/missions/nouveau", label: "➕ Nouvelle mission" },
        { href: "/admin/pipeline", label: "🧭 Pipeline" },
        { href: "/admin/matching", label: "🎯 Matching" },
      ] };
    }
    if (dans("/admin/offres", "/admin/questionnaires", "/admin/sourcing")) {
      return { titre: "Offres", items: [
        { href: "/admin/offres", label: "💼 Liste des offres" },
        { href: "/admin/offres/nouveau", label: "➕ Créer une offre" },
        { href: "/admin/questionnaires", label: "📝 Questionnaires" },
        { href: "/admin/sourcing", label: "📡 Sourcing" },
      ] };
    }
    if (dans("/admin/candidats", "/admin/relances")) {
      return { titre: "Candidats", items: [
        { href: "/admin/candidats", label: "🗂️ CVthèque et vivier" },
        { href: "/admin/candidats/nouveau", label: "➕ Ajouter un candidat" },
        { href: "/admin/relances", label: "🔔 Relances automatiques" },
      ] };
    }
    if (dans("/admin/presentations")) {
      return { titre: "Présentations", items: [
        { href: "/admin/presentations", label: "📤 Registre des présentations" },
        { href: "/admin/presentations/nouvelle", label: "➕ Présenter un candidat" },
        { href: "/admin/presentations/registre", label: "🔒 Journal anti-litiges" },
      ] };
    }
    if (dans("/admin/parametres")) {
      return { titre: "Paramètres", items: [
        { href: "/admin/parametres", label: "👤 Mon compte" },
        { href: "/admin/parametres/demandes", label: "🆕 Demandes d'accès" },
        { href: "/admin/parametres/equipe", label: "👥 Équipe FRANEO RH" },
        { href: "/admin/parametres/rgpd", label: "🛡️ RGPD" },
        { href: "/admin/parametres/demo", label: "🧪 Démo" },
      ] };
    }
  }
  return null;
}

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const r = rubrique(pathname, role);
  if (!r) return null;

  // Lien actif : le plus long chemin qui correspond
  const correspond = (h: string) => pathname === h || pathname.startsWith(h + "/");
  let actif: Item | null = null;
  let longueur = -1;
  for (const it of r.items) {
    for (const h of [it.href, ...(it.aussi || [])]) {
      if (correspond(h) && h.length > longueur) { actif = it; longueur = h.length; }
    }
  }

  return (
    <aside className="fr-sidebar w-70 min-h-screen bg-white shadow-md p-6 flex flex-col gap-2">
      <p className="text-xs text-gray-400 font-semibold uppercase mb-4">{r.titre}</p>
      {r.items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition ${actif === it ? "bg-violet-600 text-white" : "text-black hover:bg-gray-100"}`}
        >
          <span>{it.label}</span>
          {!!it.badge && it.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{it.badge}</span>}
        </Link>
      ))}
    </aside>
  );
}
