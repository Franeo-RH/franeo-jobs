import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Carte, EnTete, Pastille, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { basculerAcces, basculerClient, creerAccesClient, majClient } from "@/lib/actions/gestion";
import { STATUTS_MISSION, STATUTS_PRESENTATION, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function FicheClient({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const c = await prisma.entreprise.findUnique({
    where: { id },
    include: {
      utilisateurs: { orderBy: { createdAt: "asc" } },
      missions: { orderBy: { createdAt: "desc" } },
      presentations: { orderBy: { envoyeAt: "desc" }, include: { candidat: true, mission: true }, take: 20 },
    },
  });
  if (!c) notFound();
  const L = "block text-sm font-semibold mb-1";
  return (
    <>
      <EnTete titre={c.nom} sous={`${c.secteur || "Secteur non renseigné"} · ${c.ville || "ville non renseignée"}`}>
        <Link href={`/admin/missions/nouveau?entrepriseId=${c.id}`} className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">➕ Nouvelle mission</Link>
        <form action={basculerClient}><input type="hidden" name="id" value={c.id} /><BoutonAction confirmation={c.actif ? "Suspendre ce client ? Ses contacts ne pourront plus se connecter." : undefined} className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200">{c.actif ? "⏸ Suspendre" : "▶ Réactiver"}</BoutonAction></form>
      </EnTete>
      <Alerte erreur={sp.erreur} />

      <Carte titre="Informations">
        <form action={majClient} className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <input type="hidden" name="id" value={c.id} />
          <div><label className={L}>Entreprise</label><input name="nom" defaultValue={c.nom} className={champ} required /></div>
          <div><label className={L}>Secteur</label><input name="secteur" defaultValue={c.secteur ?? ""} className={champ} /></div>
          <div><label className={L}>Contact</label><input name="contactNom" defaultValue={c.contactNom ?? ""} className={champ} /></div>
          <div><label className={L}>Poste du contact</label><input name="contactPoste" defaultValue={c.contactPoste ?? ""} className={champ} /></div>
          <div><label className={L}>E-mail</label><input name="email" defaultValue={c.email ?? ""} className={champ} /></div>
          <div><label className={L}>Téléphone</label><input name="telephone" defaultValue={c.telephone ?? ""} className={champ} /></div>
          <div><label className={L}>Ville</label><input name="ville" defaultValue={c.ville ?? ""} className={champ} /></div>
          <div><label className={L}>SIRET</label><input name="siret" defaultValue={c.siret ?? ""} className={champ} /></div>
          <div><label className={L}>Honoraires (%)</label><input name="tauxHonoraires" defaultValue={c.tauxHonoraires} className={champ} /></div>
          <div><label className={L}>Garantie (mois)</label><input name="garantieMois" defaultValue={c.garantieMois} className={champ} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label className={L}>Notes internes</label><textarea name="notes" rows={3} defaultValue={c.notes ?? ""} className={champ} /></div>
          <div><BoutonAction>Enregistrer</BoutonAction></div>
        </form>
      </Carte>

      <Carte titre="Accès client">
        <table className="w-full text-left mb-6">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Nom</th><th>E-mail</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {c.utilisateurs.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td data-label="Nom" className="py-2">{u.prenom} {u.nom}</td>
                <td data-label="E-mail">{u.email}</td>
                <td data-label="Statut">{u.actif ? "Actif" : "Désactivé"}</td>
                <td data-label=""><form action={basculerAcces}><input type="hidden" name="id" value={u.id} /><BoutonAction className="text-sm text-violet-700 underline">{u.actif ? "Désactiver" : "Réactiver"}</BoutonAction></form></td>
              </tr>
            ))}
            {c.utilisateurs.length === 0 && <tr><td colSpan={4} className="py-4 text-gray-500">Aucun accès. Créez-en un ci-dessous.</td></tr>}
          </tbody>
        </table>
        <form action={creerAccesClient} className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <input type="hidden" name="entrepriseId" value={c.id} />
          <input name="prenom" placeholder="Prénom" className={champ} />
          <input name="nom" placeholder="Nom" className={champ} />
          <input name="email" type="email" placeholder="E-mail *" className={champ} required />
          <input name="motDePasse" type="text" placeholder="Mot de passe provisoire (8 car. min.) *" className={champ} required minLength={8} />
          <div><BoutonAction>Créer l&apos;accès</BoutonAction></div>
        </form>
      </Carte>

      <Carte titre={`Missions (${c.missions.length})`}>
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Réf.</th><th>Poste</th><th>Lieu</th><th>Statut</th><th>Créée le</th></tr></thead>
          <tbody>
            {c.missions.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td data-label="Réf." className="py-2"><Link href={`/admin/missions/${m.id}`} className="text-violet-700 font-semibold hover:underline">{m.reference}</Link></td>
                <td data-label="Poste">{m.poste}</td><td data-label="Lieu">{m.lieu}</td>
                <td data-label="Statut"><Pastille def={STATUTS_MISSION[m.statut]} /></td><td data-label="Créée le">{formatDate(m.createdAt)}</td>
              </tr>
            ))}
            {c.missions.length === 0 && <tr><td colSpan={5} className="py-4 text-gray-500">Aucune mission.</td></tr>}
          </tbody>
        </table>
      </Carte>

      <Carte titre="Dernières présentations">
        <table className="w-full text-left">
          <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Candidat</th><th>Mission</th><th>Envoyée le</th><th>Retour</th></tr></thead>
          <tbody>
            {c.presentations.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td data-label="Candidat" className="py-2"><Link href={`/admin/candidats/${p.candidatId}`} className="text-violet-700 hover:underline">{p.candidat.prenom} {p.candidat.nom}</Link></td>
                <td data-label="Mission">{p.mission.reference}</td><td data-label="Envoyée le">{formatDate(p.envoyeAt)}</td>
                <td data-label="Retour"><Pastille def={STATUTS_PRESENTATION[p.statut]} /></td>
              </tr>
            ))}
            {c.presentations.length === 0 && <tr><td colSpan={4} className="py-4 text-gray-500">Aucune présentation.</td></tr>}
          </tbody>
        </table>
      </Carte>
    </>
  );
}
