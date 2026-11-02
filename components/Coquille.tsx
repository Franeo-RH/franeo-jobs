import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

/** Cadre commun des pages admin et client : barre noire, barre latérale, contenu */
export default function Coquille({ session, children }: { session: { role: string; prenom: string }; children: React.ReactNode }) {
  const role = session.role === "ADMIN" ? "ADMIN" : "CLIENT";
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar role={role} prenom={session.prenom} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 p-10 min-w-0">{children}</main>
      </div>
    </div>
  );
}

/** Carte d'en-tête de page (titre, sous-titre, boutons à droite) */
export function EnTete({ titre, sous, children }: { titre: string; sous?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-8 mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">{titre}</h1>
        {sous && <p className="text-gray-500 mt-1">{sous}</p>}
      </div>
      {children && <div className="flex gap-3 flex-wrap">{children}</div>}
    </div>
  );
}

export function Carte({ titre, children, className = "" }: { titre?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow p-8 mb-6 ${className}`}>
      {titre && <h2 className="text-xl font-bold mb-4">{titre}</h2>}
      {children}
    </div>
  );
}

export function Pastille({ def, label }: { def?: { label: string; fond: string; texte: string }; label?: string }) {
  const d = def ?? { label: label ?? "", fond: "#f3f4f6", texte: "#4b5563" };
  return <span className="fr-pastille" style={{ backgroundColor: d.fond, color: d.texte }}>{label ?? d.label}</span>;
}

export function Jauge({ valeur }: { valeur: number }) {
  return <div className="fr-jauge" role="img" aria-label={`${valeur} sur 100`}><span style={{ width: `${Math.max(0, Math.min(100, valeur))}%` }} /></div>;
}

export function Chiffre({ label, valeur, note, href }: { label: string; valeur: React.ReactNode; note?: string; href?: string }) {
  const contenu = (
    <div className="bg-white rounded-xl shadow p-5 h-full">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{valeur}</p>
      {note && <p className="text-xs text-violet-700 mt-1">{note}</p>}
    </div>
  );
  return href ? <a href={href} className="block hover:opacity-90 transition">{contenu}</a> : contenu;
}

export const champ = "w-full border rounded-lg px-4 py-3 text-black bg-white";
export const boutonPrincipal = "bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700 transition";
export const boutonSecondaire = "bg-gray-100 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200 transition";
