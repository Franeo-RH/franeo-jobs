import { prisma } from "@/lib/prisma";
import { Carte, Chiffre, EnTete, Jauge } from "@/components/Coquille";
import { PARTIES_QUESTIONNAIRE, QUESTIONNAIRES, cleParCategorie } from "@/lib/questionnaires";
import { CATEGORIES } from "@/lib/constantes";
import Domino from "@/components/Domino";

export const dynamic = "force-dynamic";

export default async function Questionnaires() {
  const passages = await prisma.candidature.findMany({
    where: { questionnaire: { not: null }, scoreTest: { not: null }, candidat: { demo: false } },
    select: { questionnaire: true, scoreTest: true, dureeTestSec: true, reponses: true, aRelire: true },
  });
  const aNoter = passages.filter((p) => p.aRelire).length;
  const moyenne = (l: number[]) => (l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null);

  return (
    <>
      <EnTete titre="Questionnaires de présélection" sous="Un questionnaire par métier : 6 questions techniques, 6 de logique, 4 dominos et 3 mises en situation ; plus un test de logique seul (dominos et raisonnement) et des questionnaires par poste (logistique, électricité, accueil) à choisir sur l'offre. Demandé automatiquement à la candidature, corrigé par le serveur (les bonnes réponses ne sont jamais envoyées au candidat)." />
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Chiffre label="Questionnaires disponibles" valeur={Object.keys(QUESTIONNAIRES).length} />
        <Chiffre label="Tests passés" valeur={passages.length} />
        <Chiffre label="Score moyen" valeur={moyenne(passages.map((p) => p.scoreTest!)) ?? "—"} note="sur 100" />
        <Chiffre label="Réponses libres à noter" valeur={aNoter} note={aNoter ? "sur les fiches candidats" : undefined} href="/admin/candidats" />
      </div>

      <Carte titre="Quel questionnaire pour quel métier ?">
        <ul className="grid gap-2 text-sm" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {CATEGORIES.map((c) => <li key={c} className="flex justify-between border-b py-1"><span>{c}</span><b>{QUESTIONNAIRES[cleParCategorie(c)]?.nom}</b></li>)}
        </ul>
        <p className="text-xs text-gray-500 mt-3">Sur chaque offre, vous pouvez imposer un autre questionnaire, n&apos;en mettre aucun, et fixer un score minimal conseillé.</p>
      </Carte>

      {Object.values(QUESTIONNAIRES).map((q) => {
        const ps = passages.filter((p) => p.questionnaire === q.cle);
        const scoreMoyen = moyenne(ps.map((p) => p.scoreTest!));
        const dureeMoy = moyenne(ps.map((p) => p.dureeTestSec ?? 0).filter(Boolean));
        // Taux de bonne réponse par question (questions à choix seulement)
        const taux = q.questions.map((x, i) => {
          if (x.type !== "qcm") return null;
          const reps = ps.map((p) => (Array.isArray(p.reponses) ? (p.reponses as unknown[])[i] : null)).filter((r) => r !== null && r !== undefined);
          return reps.length ? Math.round((reps.filter((r) => Number(r) === x.bonne).length / reps.length) * 100) : null;
        });
        return (
          <Carte key={q.cle} titre={`${q.nom} · ${q.questions.length} questions · ${q.dureeMin} min`}>
            <p className="text-sm text-gray-600 mb-3">
              Axes : {q.axes.join(" · ")}<br />
              {ps.length ? <>Passé <b>{ps.length}</b> fois · score moyen <b>{scoreMoyen}/100</b>{dureeMoy ? <> · durée moyenne <b>{Math.round(dureeMoy / 60)} min</b></> : null}</> : "Pas encore passé."}
            </p>
            <details>
              <summary className="cursor-pointer font-semibold text-violet-700">Voir les questions et les taux de réussite</summary>
              <ol className="mt-3 flex flex-col gap-3 list-decimal pl-5">
                {q.questions.map((x, i) => (
                  <li key={i}>
                    <p><span className="text-xs bg-gray-100 rounded px-2 py-0.5 mr-2">{PARTIES_QUESTIONNAIRE[x.partie]}</span>{x.q}</p>
                    {x.dominos && <div className="flex gap-2 my-2 items-center">{x.dominos.map(([h, b], k) => <Domino key={k} haut={h} bas={b} />)}<Domino vide /></div>}
                    {x.options && <ul className="text-sm text-gray-600 ml-2">{x.options.map((o, j) => <li key={j} className={j === x.bonne ? "text-green-700 font-semibold" : ""}>{j === x.bonne ? "✓ " : "• "}{o}</li>)}</ul>}
                    {x.type !== "qcm" && <p className="text-xs text-gray-500">{x.type === "libre" ? "Réponse libre, notée de 0 à 5 par le consultant (20 % du score final)" : "Échelle de 1 à 5 (profil, non noté)"}</p>}
                    {taux[i] != null && <div className="max-w-xs mt-1 text-xs"><div className="flex justify-between"><span>Réussite</span><b>{taux[i]} %</b></div><Jauge valeur={taux[i]!} /></div>}
                  </li>
                ))}
              </ol>
            </details>
          </Carte>
        );
      })}
    </>
  );
}
