import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Carte, Chiffre, EnTete, Jauge } from "@/components/Coquille";
import { euros, formatDate, MISSIONS_OUVERTES } from "@/lib/constantes";
import { reglesActives } from "@/lib/relances";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const il7 = new Date(Date.now() - 7 * 86400000);
  const reel = { entreprise: { demo: false } };
  const [offresActives, candidatsTotal, nouveaux7, missionsOuvertes, enAttente, embauches, factures, presentations, parSource, parMetier, aTraiter, demandes, relancesDues, actives] = await Promise.all([
    prisma.offre.count({ where: { statut: "PUBLIEE" } }),
    prisma.candidat.count({ where: { demo: false } }),
    prisma.candidat.count({ where: { demo: false, createdAt: { gte: il7 } } }),
    prisma.mission.count({ where: { ...reel, statut: { in: MISSIONS_OUVERTES } } }),
    prisma.presentation.count({ where: { ...reel, statut: "EN_ATTENTE" } }),
    prisma.candidature.count({ where: { etape: "EMBAUCHE", mission: reel } }),
    prisma.facture.aggregate({ where: reel, _sum: { honoraires: true } }),
    prisma.presentation.findMany({ where: reel, select: { statut: true, envoyeAt: true, retourAt: true } }),
    prisma.candidat.groupBy({ by: ["source"], where: { demo: false }, _count: { _all: true }, orderBy: { _count: { source: "desc" } } }),
    prisma.candidat.groupBy({ by: ["metier"], where: { demo: false }, _count: { _all: true }, orderBy: { _count: { metier: "desc" } }, take: 6 }),
    prisma.candidature.findMany({ where: { etape: "NOUVEAU", retireeAt: null, candidat: { demo: false } }, orderBy: { createdAt: "desc" }, take: 6, include: { candidat: true, offre: { select: { titre: true } } } }),
    prisma.demandeInscription.count({ where: { statut: "NOUVELLE" } }),
    prisma.relance.count({ where: { envoyeeAt: null, prevueLe: { lte: new Date() }, candidat: { demo: false } } }),
    reglesActives(),
  ]);

  const repondues = presentations.filter((p) => p.retourAt);
  const tauxReponse = presentations.length ? Math.round((repondues.length / presentations.length) * 100) : 0;
  const delaiMoyen = repondues.length ? Math.round(repondues.reduce((t, p) => t + (p.retourAt!.getTime() - p.envoyeAt.getTime()), 0) / repondues.length / 3600000) : 0;
  const tauxRetenu = presentations.length ? Math.round((presentations.filter((p) => p.statut === "RETENU").length / presentations.length) * 100) : 0;
  const tauxEmbauche = presentations.length ? Math.round((embauches / presentations.length) * 100) : 0;
  const maxSource = Math.max(1, ...parSource.map((s) => s._count._all));
  const maxMetier = Math.max(1, ...parMetier.map((s) => s._count._all));

  return (
    <>
      <EnTete titre="Dashboard" sous="Vue d'ensemble de votre activité de recrutement" />

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Chiffre label="Offres publiées" valeur={offresActives} href="/admin/offres" />
        <Chiffre label="Candidats en CVthèque" valeur={candidatsTotal} note={`+${nouveaux7} sur 7 jours`} href="/admin/candidats" />
        <Chiffre label="Missions ouvertes" valeur={missionsOuvertes} href="/admin/missions" />
        <Chiffre label="Présentations en attente" valeur={enAttente} note="retour client attendu" href="/admin/presentations" />
        <Chiffre label="Embauches" valeur={embauches} href="/admin/pipeline" />
        <Chiffre label="Honoraires facturés" valeur={euros(factures._sum.honoraires ?? 0)} href="/admin/facturation" />
        <Chiffre label="Demandes d'accès" valeur={demandes} href="/admin/parametres/demandes" />
        <Chiffre label="Relances à envoyer" valeur={relancesDues} href="/admin/relances" />
      </div>

      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Carte titre="À traiter : nouvelles candidatures" className="!mb-0">
          {aTraiter.length === 0 ? <p className="text-gray-500">Rien en attente. 🎉</p> : (
            <ul className="divide-y">
              {aTraiter.map((c) => (
                <li key={c.id} className="py-3 flex justify-between gap-3">
                  <div>
                    <Link href={`/admin/candidats/${c.candidatId}`} className="font-semibold text-violet-700 hover:underline">{c.candidat.prenom} {c.candidat.nom}</Link>
                    <p className="text-sm text-gray-500">{c.offre?.titre ?? "Candidature spontanée"}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {c.scoreTest != null && <p className="font-semibold text-gray-800">Test {c.scoreTest}/100</p>}
                    <p>{formatDate(c.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre="Indicateurs stratégiques" className="!mb-0">
          <ul className="flex flex-col gap-4 text-sm">
            <li><div className="flex justify-between mb-1"><span>Taux de réponse des clients</span><b>{tauxReponse} %</b></div><Jauge valeur={tauxReponse} /></li>
            <li><div className="flex justify-between mb-1"><span>Candidats retenus par les clients</span><b>{tauxRetenu} %</b></div><Jauge valeur={tauxRetenu} /></li>
            <li><div className="flex justify-between mb-1"><span>Présentations → embauches</span><b>{tauxEmbauche} %</b></div><Jauge valeur={tauxEmbauche} /></li>
            <li className="flex justify-between"><span>Délai moyen de retour client</span><b>{repondues.length ? `${delaiMoyen} h` : "—"}</b></li>
            <li className="flex justify-between"><span>Relances automatiques actives</span><b>{Object.values(actives).filter(Boolean).length} / 3</b></li>
          </ul>
        </Carte>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Carte titre="Candidats par source" className="!mb-0">
          {parSource.length === 0 ? <p className="text-gray-500">Aucun candidat pour le moment.</p> : (
            <ul className="flex flex-col gap-3 text-sm">
              {parSource.map((s) => (<li key={s.source}><div className="flex justify-between mb-1"><span>{s.source}</span><b>{s._count._all}</b></div><Jauge valeur={(s._count._all / maxSource) * 100} /></li>))}
            </ul>
          )}
        </Carte>
        <Carte titre="Vivier par métier" className="!mb-0">
          {parMetier.length === 0 ? <p className="text-gray-500">Aucun candidat pour le moment.</p> : (
            <ul className="flex flex-col gap-3 text-sm">
              {parMetier.map((s) => (<li key={s.metier}><div className="flex justify-between mb-1"><span>{s.metier}</span><b>{s._count._all}</b></div><Jauge valeur={(s._count._all / maxMetier) * 100} /></li>))}
            </ul>
          )}
        </Carte>
      </div>
    </>
  );
}
