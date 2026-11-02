import { exigerClient } from "@/lib/session";
import { Carte, EnTete, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { changerMotDePasseClient } from "@/lib/actions/client";

export const dynamic = "force-dynamic";

export default async function Profil({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await exigerClient();
  const sp = await searchParams;
  const L = "block text-sm font-semibold mb-1";
  return (
    <>
      <EnTete titre="Mon mot de passe" sous={`${s.prenom} ${s.nom} · ${s.email}`} />
      <Alerte erreur={sp.erreur} ok={sp.ok} />
      <Carte>
        <form action={changerMotDePasseClient} className="grid gap-3 max-w-md">
          <div><label className={L}>Mot de passe actuel</label><input name="actuel" type="password" className={champ} required autoComplete="current-password" /></div>
          <div><label className={L}>Nouveau mot de passe (8 caractères minimum)</label><input name="nouveau" type="password" minLength={8} className={champ} required autoComplete="new-password" /></div>
          <div><BoutonAction>Enregistrer</BoutonAction></div>
        </form>
      </Carte>
    </>
  );
}
