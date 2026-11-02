import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EnTete, champ } from "@/components/Coquille";
import Alerte from "@/components/Alerte";
import BoutonAction from "@/components/BoutonAction";
import BoutonExport from "@/components/BoutonExport";
import { deplacerEtape, marquerEmbauche } from "@/lib/actions/candidats";
import { ETAPES, MISSIONS_OUVERTES } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Pipeline({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const missions = await prisma.mission.findMany({ where: { entreprise: { demo: false }, statut: { in: MISSIONS_OUVERTES } }, orderBy: { createdAt: "desc" }, include: { entreprise: true } });
  const candidatures = await prisma.candidature.findMany({
    where: { candidat: { demo: false }, retireeAt: null, ...(sp.mission ? { missionId: sp.mission } : { missionId: { not: null } }) },
    include: { candidat: true, mission: true }, orderBy: { updatedAt: "desc" },
  });
  const colonnes = ETAPES.filter((e) => e.code !== "REFUSE").concat(ETAPES.filter((e) => e.code === "REFUSE"));
  return (
    <>
      <EnTete titre="Pipeline de recrutement" sous="De la candidature à l'embauche, mission par mission">
        <BoutonExport type="pipeline" />
      </EnTete>
      <Alerte erreur={sp.erreur} />
      <form className="bg-white rounded-xl shadow p-6 mb-6 flex gap-3 items-end flex-wrap">
        <div><label className="block text-sm font-semibold mb-1">Mission</label>
          <select name="mission" defaultValue={sp.mission ?? ""} className={champ}><option value="">Toutes les missions</option>{missions.map((m) => <option key={m.id} value={m.id}>{m.reference} · {m.poste} ({m.entreprise.nom})</option>)}</select></div>
        <button className="bg-violet-600 text-white px-5 py-3 rounded-lg font-semibold">Filtrer</button>
      </form>

      <div className="fr-kanban">
        {colonnes.map((col) => {
          const cartes = candidatures.filter((c) => c.etape === col.code);
          return (
            <section key={col.code} className="fr-colonne" aria-label={col.label}>
              <h2 className="font-bold text-sm flex justify-between"><span>{col.label}</span><span className="text-gray-500">{cartes.length}</span></h2>
              {cartes.map((c) => (
                <article key={c.id} className="fr-carte-kanban">
                  <Link href={`/admin/candidats/${c.candidatId}`} className="font-semibold text-violet-700 hover:underline">{c.candidat.prenom} {c.candidat.nom}</Link>
                  <p className="text-xs text-gray-500">{c.mission?.reference} · {c.mission?.poste}</p>
                  {c.scoreTest != null && <p className="text-xs mt-1">Test : <b>{c.scoreTest}/100</b></p>}
                  <form action={deplacerEtape} className="mt-2 flex gap-1">
                    <input type="hidden" name="id" value={c.id} />
                    <select name="etape" defaultValue={c.etape} className="border rounded px-1 py-1 text-xs flex-1 text-black bg-white" aria-label="Changer d'étape">{ETAPES.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}</select>
                    <BoutonAction className="bg-violet-600 text-white px-2 rounded text-xs">OK</BoutonAction>
                  </form>
                  {c.etape === "PROPOSITION" && (
                    <form action={marquerEmbauche} className="mt-2 flex gap-1">
                      <input type="hidden" name="id" value={c.id} />
                      <input name="salaire" inputMode="numeric" placeholder="Salaire brut/an" className="border rounded px-2 py-1 text-xs flex-1 text-black bg-white" required />
                      <BoutonAction confirmation="Marquer ce candidat comme embauché et créer la facture d'honoraires ?" className="bg-green-600 text-white px-2 rounded text-xs">Embauché</BoutonAction>
                    </form>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
