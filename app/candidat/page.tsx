import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigerCandidat } from "@/lib/session";
import { Carte, Jauge } from "@/components/Coquille";
import { formatDate } from "@/lib/constantes";
import BoutonAction from "@/components/BoutonAction";
import { retirerCandidature } from "@/lib/actions/candidat";

export const dynamic = "force-dynamic";

// Les étapes internes, traduites en étapes compréhensibles par le candidat
const PARCOURS = [
  { titre: "Candidature reçue", etapes: ["NOUVEAU"] },
  { titre: "En cours d'étude", etapes: ["PREQUALIFICATION"] },
  { titre: "Entretien FRANEO RH", etapes: ["ENTRETIEN_FRANEO", "PRESENTABLE"] },
  { titre: "Dossier transmis à l'entreprise", etapes: ["PRESENTE"] },
  { titre: "Entretien avec l'entreprise", etapes: ["ENTRETIEN_CLIENT"] },
  { titre: "Proposition", etapes: ["PROPOSITION"] },
  { titre: "Embauche 🎉", etapes: ["EMBAUCHE"] },
];
const RETOUR: Record<string, { texte: string; couleur: string }> = {
  EN_ATTENTE: { texte: "En attente de réponse", couleur: "bg-gray-100 text-gray-700" },
  A_REVOIR: { texte: "En réflexion", couleur: "bg-amber-100 text-amber-800" },
  RETENU: { texte: "Retenu pour la suite", couleur: "bg-green-100 text-green-800" },
  REFUSE: { texte: "Non retenu", couleur: "bg-red-100 text-red-700" },
};

export default async function MonSuivi({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await exigerCandidat();
  const sp = await searchParams;
  const c = await prisma.candidat.findUnique({
    where: { id: s.candidatId },
    include: {
      candidatures: { orderBy: { createdAt: "desc" }, include: { offre: { select: { titre: true, lieu: true, slug: true } }, mission: { select: { poste: true, lieu: true } } } },
      presentations: { orderBy: { envoyeAt: "desc" }, include: { entreprise: { select: { nom: true, ville: true } }, mission: { select: { poste: true } } } },
      entretiens: { orderBy: { date: "desc" }, take: 1 },
    },
  });
  if (!c) return null;
  const champs = [c.telephone, c.ville, c.poste, c.disponibilite, c.salaireSouhaite, c.cvNom, c.competences.length ? 1 : null, c.experience];
  const completude = Math.round((champs.filter(Boolean).length / champs.length) * 100);

  return (
    <>
      {sp.retiree && <p className="bg-gray-50 text-gray-700 border rounded-lg px-4 py-3 mb-6">Votre candidature a bien été retirée. Votre consultant a été prévenu.</p>}
      {sp.bienvenue && <p className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 mb-6">Votre espace est activé, bienvenue {c.prenom} ! ✅</p>}
      <div className="bg-white rounded-xl shadow p-8 mb-6 flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Bonjour {c.prenom}</h1>
          <p className="text-gray-500 mt-1">Suivez ici l&apos;avancement de vos candidatures chez FRANEO RH.</p>
        </div>
        <div style={{ minWidth: 220 }}>
          <p className="text-sm text-gray-500 mb-1">Profil complété à <b className="text-violet-700">{completude} %</b></p>
          <Jauge valeur={completude} />
          {completude < 100 && <Link href="/candidat/profil" className="text-sm text-violet-700 underline">Compléter mon profil</Link>}
        </div>
      </div>

      <Carte titre={`Mes candidatures (${c.candidatures.length})`}>
        {c.candidatures.length === 0 && <p className="text-gray-500">Aucune candidature pour l&apos;instant. <Link href="/offres" className="text-violet-700 underline">Voir les offres</Link></p>}
        <div className="flex flex-col gap-6">
          {c.candidatures.map((a) => {
            const refuse = a.etape === "REFUSE";
            const idx = PARCOURS.findIndex((p) => p.etapes.includes(a.etape));
            return (
              <article key={a.id} className="border rounded-xl p-5">
                <div className="flex justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{a.offre?.titre ?? a.mission?.poste ?? "Candidature spontanée"}</h3>
                    <p className="text-sm text-gray-500">{a.offre?.lieu ?? a.mission?.lieu ?? ""} · envoyée le {formatDate(a.createdAt)}</p>
                  </div>
                  {a.scoreTest != null && <div className="text-right"><p className="text-sm text-gray-500">Questionnaire</p><p className="text-2xl font-bold text-violet-700">{a.scoreTest}/100</p></div>}
                </div>
                {a.retireeAt ? (
                  <p className="bg-gray-50 rounded-lg px-4 py-3 text-gray-700">Vous avez retiré cette candidature le {formatDate(a.retireeAt)}.</p>
                ) : refuse ? (
                  <p className="bg-gray-50 rounded-lg px-4 py-3 text-gray-700">Cette candidature n&apos;a pas été retenue. Votre profil reste dans notre vivier : nous vous recontacterons pour une mission qui vous correspond.</p>
                ) : (
                  <ol className="flex flex-col gap-2" aria-label="Avancement">
                    {PARCOURS.map((p, i) => (
                      <li key={p.titre} className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${i < idx ? "bg-violet-600 text-white" : i === idx ? "bg-violet-100 text-violet-700 ring-2 ring-violet-600" : "bg-gray-100 text-gray-400"}`}>{i < idx ? "✓" : i + 1}</span>
                        <span className={i === idx ? "font-semibold" : i < idx ? "text-gray-700" : "text-gray-400"}>{p.titre}{i === idx && " · étape actuelle"}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {a.axes && Object.keys(a.axes as object).length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-violet-700">Voir mes résultats détaillés</summary>
                    <ul className="grid gap-2 mt-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                      {Object.entries(a.axes as Record<string, number>).map(([k, v]) => <li key={k} className="text-sm"><div className="flex justify-between"><span>{k}</span><b>{v}</b></div><Jauge valeur={v} /></li>)}
                    </ul>
                  </details>
                )}
                {!a.retireeAt && !refuse && a.etape !== "EMBAUCHE" && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-500">Retirer ma candidature</summary>
                    <form action={retirerCandidature} className="mt-2 flex gap-2 flex-wrap">
                      <input type="hidden" name="id" value={a.id} />
                      <input name="motif" placeholder="Motif (facultatif) : poste trouvé, plus disponible…" className="border rounded-lg px-3 py-2 flex-1 text-black bg-white" style={{ minWidth: 220 }} />
                      <BoutonAction confirmation="Retirer cette candidature ?" className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-semibold">Retirer</BoutonAction>
                    </form>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      </Carte>

      <Carte titre="Où mon CV a été envoyé">
        {c.presentations.length === 0 ? (
          <p className="text-gray-500">Votre CV n&apos;a encore été transmis à aucune entreprise. Votre consultant le fera dès qu&apos;une mission correspond à votre profil.</p>
        ) : (
          <table className="w-full text-left">
            <thead><tr className="text-sm text-gray-500 border-b"><th className="py-2">Entreprise</th><th>Poste</th><th>Envoyé le</th><th>Consulté</th><th>Réponse</th></tr></thead>
            <tbody>
              {c.presentations.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td data-label="Entreprise" className="py-3 font-semibold">{p.entreprise.nom}{p.entreprise.ville ? <span className="text-sm text-gray-500 font-normal"> · {p.entreprise.ville}</span> : null}</td>
                  <td data-label="Poste">{p.mission.poste}</td>
                  <td data-label="Envoyé le">{formatDate(p.envoyeAt)}</td>
                  <td data-label="Consulté">{p.consulteAt ? `Oui, le ${formatDate(p.consulteAt)}` : "Pas encore"}</td>
                  <td data-label="Réponse"><span className={`fr-pastille ${RETOUR[p.statut]?.couleur ?? ""}`}>{RETOUR[p.statut]?.texte ?? p.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Carte>

      {c.entretiens[0] && (
        <Carte titre="Mon entretien avec FRANEO RH">
          <p>Entretien réalisé le {formatDate(c.entretiens[0].date)} avec {c.entretiens[0].consultant}.</p>
        </Carte>
      )}
    </>
  );
}
