import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Carte, EnTete, Jauge, Pastille, champ } from "@/components/Coquille";
import BoutonAction from "@/components/BoutonAction";
import { ajouterEntretien, ajouterNote, anonymiserCandidat, majCandidat, noterReponseLibre } from "@/lib/actions/candidats";
import { QUESTIONNAIRES, scoreAjuste } from "@/lib/questionnaires";
import { CATEGORIES, DISPONIBILITES, STATUTS_CANDIDAT, STATUTS_PRESENTATION, TYPES_NOTE, euros, formatDate, formatDateHeure, libelleEtape } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function FicheCandidat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.candidat.findUnique({
    where: { id },
    include: {
      candidatures: { include: { offre: { select: { titre: true, seuilTest: true } }, mission: { select: { reference: true, poste: true } } }, orderBy: { createdAt: "desc" } },
      compte: { select: { actif: true } }, notes: { orderBy: { createdAt: "desc" } }, entretiens: { orderBy: { date: "desc" } },
      presentations: { include: { entreprise: true, mission: true }, orderBy: { envoyeAt: "desc" } },
    },
  });
  if (!c || c.demo) notFound();
  const L = "block text-sm font-semibold mb-1";
  const avecTest = c.candidatures.filter((x) => x.scoreTest != null);
  return (
    <>
      <EnTete titre={`${c.prenom} ${c.nom}`} sous={<><Pastille def={STATUTS_CANDIDAT[c.statut]} /> · {c.poste || c.metier} · {c.ville || "ville inconnue"}</>}>
        {c.cvNom && <a href={`/api/candidats/${c.id}/cv`} className="bg-gray-100 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-200">📄 Télécharger le CV</a>}
        <Link href={`/admin/presentations/nouvelle?candidatId=${c.id}`} className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">📤 Présenter</Link>
      </EnTete>

      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
        <Carte titre="Profil" className="!mb-0">
          <dl className="grid gap-2 text-sm" style={{ gridTemplateColumns: "auto 1fr" }}>
            <dt className="text-gray-500">E-mail</dt><dd>{c.email || "—"}</dd>
            <dt className="text-gray-500">Téléphone</dt><dd>{c.telephone || "—"}</dd>
            <dt className="text-gray-500">LinkedIn</dt><dd>{c.linkedin ? <a href={c.linkedin.startsWith("http") ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-violet-700 underline">{c.linkedin}</a> : "—"}</dd>
            <dt className="text-gray-500">Expérience</dt><dd>{c.experience || "—"}</dd>
            <dt className="text-gray-500">Études</dt><dd>{c.niveau || "—"}</dd>
            <dt className="text-gray-500">Disponibilité</dt><dd>{c.disponibilite || "—"} {c.preavis ? `(préavis : ${c.preavis})` : ""}</dd>
            <dt className="text-gray-500">Mobilité</dt><dd>{c.mobilite || "—"} · télétravail : {c.teletravail || "—"}</dd>
            <dt className="text-gray-500">Salaire souhaité</dt><dd>{euros(c.salaireSouhaite)}</dd>
            <dt className="text-gray-500">Source</dt><dd>{c.source}</dd>
            <dt className="text-gray-500">Reçu le</dt><dd>{formatDate(c.createdAt)}</dd>
            <dt className="text-gray-500">Espace candidat</dt><dd>{c.compte ? (c.compte.actif ? "Créé et activé" : "Créé, en attente d'activation") : "Pas d'espace"}</dd>
            <dt className="text-gray-500">Consentement RGPD</dt><dd>{c.consentementAt ? formatDate(c.consentementAt) : "Non recueilli"}</dd>
          </dl>
          {c.competences.length > 0 && <p className="mt-3 flex gap-2 flex-wrap">{c.competences.map((k) => <span key={k} className="fr-pastille bg-violet-100 text-violet-800">{k}</span>)}</p>}
        </Carte>

        <Carte titre="Qualification" className="!mb-0">
          <form action={majCandidat} className="grid gap-3">
            <input type="hidden" name="id" value={c.id} />
            <div><label className={L}>Statut</label><select name="statut" defaultValue={c.statut} className={champ}>{Object.entries(STATUTS_CANDIDAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            <div><label className={L}>Métier</label><select name="metier" defaultValue={c.metier} className={champ}>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className={L}>Poste recherché</label><input name="poste" defaultValue={c.poste ?? ""} className={champ} /></div>
            <div><label className={L}>Compétences</label><input name="competences" defaultValue={c.competences.join(", ")} className={champ} /></div>
            <div><label className={L}>Disponibilité</label><select name="disponibilite" defaultValue={c.disponibilite ?? ""} className={champ}><option value="">—</option>{DISPONIBILITES.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className={L}>Salaire souhaité</label><input name="salaireSouhaite" defaultValue={c.salaireSouhaite ?? ""} inputMode="numeric" className={champ} /></div>
            <div><BoutonAction>Enregistrer</BoutonAction></div>
          </form>
        </Carte>
      </div>

      {avecTest.length > 0 && (
        <Carte titre="Résultats du questionnaire de présélection">
          {avecTest.map((a) => {
            const axes = (a.axes ?? {}) as Record<string, number>;
            const libres = Array.isArray(a.reponses) ? (a.reponses as unknown[]).filter((r) => typeof r === "string" && r.trim()) : [];
            return (
              <div key={a.id} className="mb-5 last:mb-0">
                <p className="font-semibold">
                  {a.offre?.titre ?? "Candidature spontanée"} · {QUESTIONNAIRES[a.questionnaire ?? ""]?.nom ?? "Questionnaire"} · <span className="text-violet-700">{a.scoreTest}/100</span>
                  {a.noteLibre != null && <> · score final <span className="text-violet-700">{scoreAjuste(a.scoreTest, a.noteLibre)}/100</span></>}
                  {a.aRelire && a.noteLibre == null && <span className="text-sm text-amber-700"> · ✍️ réponse libre à noter</span>}
                </p>
                <p className="text-sm text-gray-500">
                  {a.dureeTestSec ? `Temps passé : ${Math.floor(a.dureeTestSec / 60)} min ${a.dureeTestSec % 60} s` : "Temps non mesuré"}
                  {a.dureeTestSec != null && a.dureeTestSec > 0 && a.dureeTestSec < 240 && <span className="text-amber-700"> · ⚡ très rapide, à vérifier en entretien</span>}
                  {a.offre?.seuilTest ? (a.scoreTest! >= a.offre.seuilTest ? <span className="text-green-700"> · ✅ au-dessus du seuil ({a.offre.seuilTest})</span> : <span className="text-red-700"> · ⚠️ sous le seuil ({a.offre.seuilTest})</span>) : null}
                  {a.retireeAt && <span className="text-red-700"> · retirée par le candidat le {formatDate(a.retireeAt)}</span>}
                </p>
                <ul className="grid gap-2 mt-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {Object.entries(axes).map(([k, v]) => <li key={k} className="text-sm"><div className="flex justify-between"><span>{k}</span><b>{v}</b></div><Jauge valeur={v} /></li>)}
                </ul>
                {libres.length > 0 && <div className="mt-3 flex flex-col gap-2">{libres.map((r, i) => <blockquote key={i} className="border-l-4 border-violet-300 pl-3 text-sm text-gray-700 whitespace-pre-line">{String(r)}</blockquote>)}</div>}
                {libres.length > 0 && (
                  <form action={noterReponseLibre} className="mt-3 flex gap-2 flex-wrap items-center">
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="candidatId" value={c.id} />
                    <label className="text-sm font-semibold">Note de la réponse libre</label>
                    <select name="note" defaultValue={a.noteLibre ?? ""} className="border rounded-lg px-3 py-2 text-black bg-white" required>
                      <option value="">—</option>{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
                    </select>
                    <input name="commentaire" defaultValue={a.commentaireTest ?? ""} placeholder="Commentaire (facultatif)" className="border rounded-lg px-3 py-2 text-black bg-white flex-1" style={{ minWidth: 200 }} />
                    <BoutonAction>Noter</BoutonAction>
                  </form>
                )}
              </div>
            );
          })}
        </Carte>
      )}

      <Carte titre="Candidatures et pipeline">
        <ul className="divide-y">
          {c.candidatures.map((a) => (
            <li key={a.id} className="py-2 flex justify-between gap-3"><span>{a.mission ? `${a.mission.reference} · ${a.mission.poste}` : a.offre?.titre ?? "Candidature spontanée"}</span><span className="text-sm text-gray-500">{libelleEtape(a.etape)} · {formatDate(a.createdAt)}</span></li>
          ))}
          {c.candidatures.length === 0 && <li className="py-2 text-gray-500">Aucune candidature.</li>}
        </ul>
      </Carte>

      <Carte titre="Présentations aux clients">
        <ul className="divide-y">
          {c.presentations.map((p) => (
            <li key={p.id} className="py-2 flex justify-between gap-3"><span>{p.entreprise.nom} · {p.mission.reference} · {formatDate(p.envoyeAt)}</span><Pastille def={STATUTS_PRESENTATION[p.statut]} /></li>
          ))}
          {c.presentations.length === 0 && <li className="py-2 text-gray-500">Jamais présenté.</li>}
        </ul>
      </Carte>

      <Carte titre="Entretiens FRANEO">
        <form action={ajouterEntretien} className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <input type="hidden" name="candidatId" value={c.id} />
          {[["competences", "Compétences"], ["experience", "Expérience"], ["motivation", "Motivation"], ["communication", "Communication"], ["adequation", "Adéquation"]].map(([k, l]) => (
            <div key={k}><label className={L}>{l} (0-5)</label><input name={k} type="number" min={0} max={5} defaultValue={3} className={champ} /></div>
          ))}
          <div><label className={L}>Durée (min)</label><input name="dureeMin" inputMode="numeric" className={champ} /></div>
          <div style={{ gridColumn: "1 / -1" }}><label className={L}>Commentaires</label><textarea name="commentaires" rows={3} className={champ} /></div>
          <div><BoutonAction>Enregistrer l&apos;entretien</BoutonAction></div>
        </form>
        <ul className="divide-y">
          {c.entretiens.map((e) => (
            <li key={e.id} className="py-3"><p className="font-semibold">{formatDateHeure(e.date)} · {e.consultant} · <span className="text-violet-700">{e.score}/100</span></p>{e.commentaires && <p className="text-sm text-gray-600 whitespace-pre-line">{e.commentaires}</p>}</li>
          ))}
        </ul>
      </Carte>

      <Carte titre="Journal des actions">
        <form action={ajouterNote} className="flex gap-3 flex-wrap mb-5">
          <input type="hidden" name="candidatId" value={c.id} />
          <select name="type" className={champ} style={{ maxWidth: 220 }}>{Object.entries(TYPES_NOTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input name="texte" placeholder="Ajouter une note, un échange, un commentaire…" className={champ} style={{ flex: 1, minWidth: 220 }} required />
          <BoutonAction>Ajouter</BoutonAction>
        </form>
        <ul className="divide-y">
          {c.notes.map((n) => (
            <li key={n.id} className="py-2"><p className="text-sm text-gray-500">{formatDateHeure(n.createdAt)} · {n.auteur} · {TYPES_NOTE[n.type] ?? n.type}</p><p className="whitespace-pre-line">{n.texte}</p></li>
          ))}
          {c.notes.length === 0 && <li className="py-2 text-gray-500">Aucune action enregistrée.</li>}
        </ul>
      </Carte>

      <Carte titre="Protection des données">
        <p className="text-sm text-gray-600 mb-3">À la demande du candidat, ses données personnelles peuvent être effacées. L&apos;historique des présentations est conservé de façon anonyme pour garantir les droits de FRANEO RH.</p>
        <form action={anonymiserCandidat}><input type="hidden" name="id" value={c.id} /><BoutonAction confirmation="Effacer définitivement les données personnelles de ce candidat ? Cette action est irréversible." className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700">Anonymiser ce candidat</BoutonAction></form>
      </Carte>
    </>
  );
}
