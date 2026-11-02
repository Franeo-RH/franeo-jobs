import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/session";
import { Carte, EnTete, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import { envoyerMessage } from "@/lib/actions/client";
import { TYPES_REGISTRE, formatDateHeure } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Echanges({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await exigerClient();
  const sp = await searchParams;
  const lignes = await prisma.journalRegistre.findMany({ where: { entrepriseId: s.entrepriseId, type: { in: ["ENVOI", "REPONSE", "ECHANGE"] } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <EnTete titre="Échanges avec FRANEO RH" sous="Écrivez à votre consultant et retrouvez l'historique de vos dossiers" />
      <Alerte erreur={sp.erreur} ok={sp.ok} />
      <Carte titre="Nouveau message">
        <form action={envoyerMessage} className="grid gap-3">
          <textarea name="message" rows={4} className={champ} placeholder="Une précision sur le besoin, une question sur un candidat…" required />
          <div><BoutonAction>Envoyer</BoutonAction></div>
        </form>
      </Carte>
      <Carte titre="Historique">
        <ul className="divide-y">
          {lignes.map((l) => (
            <li key={l.id} className="py-3"><p className="text-sm text-gray-500">{formatDateHeure(l.createdAt)} · {TYPES_REGISTRE[l.type]?.icone} {TYPES_REGISTRE[l.type]?.label} · {l.acteur}</p><p>{l.detail}</p></li>
          ))}
          {lignes.length === 0 && <li className="py-3 text-gray-500">Aucun échange pour le moment.</li>}
        </ul>
      </Carte>
    </>
  );
}
