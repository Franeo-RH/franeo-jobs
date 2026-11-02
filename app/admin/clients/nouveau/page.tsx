import { EnTete, Carte, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { creerClient } from "@/lib/actions/gestion";

export const dynamic = "force-dynamic";

export default async function NouveauClient({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const L = "block text-sm font-semibold mb-1";
  return (
    <>
      <EnTete titre="Ajouter un client" sous="Les accès de ses contacts se créent ensuite sur sa fiche" />
      <Alerte erreur={sp.erreur} />
      <Carte>
        <form action={creerClient} className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div><label className={L}>Entreprise *</label><input name="nom" className={champ} required /></div>
          <div><label className={L}>Secteur</label><input name="secteur" className={champ} /></div>
          <div><label className={L}>Contact</label><input name="contactNom" className={champ} /></div>
          <div><label className={L}>Poste du contact</label><input name="contactPoste" className={champ} /></div>
          <div><label className={L}>E-mail</label><input name="email" type="email" className={champ} /></div>
          <div><label className={L}>Téléphone</label><input name="telephone" className={champ} /></div>
          <div><label className={L}>Adresse</label><input name="rue" className={champ} /></div>
          <div><label className={L}>Code postal</label><input name="codePostal" className={champ} /></div>
          <div><label className={L}>Ville</label><input name="ville" className={champ} /></div>
          <div><label className={L}>Site web</label><input name="siteWeb" className={champ} /></div>
          <div><label className={L}>SIRET</label><input name="siret" className={champ} /></div>
          <div><label className={L}>Honoraires (% du salaire annuel)</label><input name="tauxHonoraires" defaultValue="20" inputMode="decimal" className={champ} /></div>
          <div><label className={L}>Garantie (mois)</label><input name="garantieMois" defaultValue="3" inputMode="numeric" className={champ} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label className={L}>Notes internes</label><textarea name="notes" rows={3} className={champ} /></div>
          <div><BoutonAction>Créer le client</BoutonAction></div>
        </form>
      </Carte>
    </>
  );
}
