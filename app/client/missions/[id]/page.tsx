import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/session";
import { Carte, EnTete, Pastille } from "@/components/Coquille";
import { STATUTS_MISSION, STATUTS_PRESENTATION, fourchette, formatDate } from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function MissionClient({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigerClient();
  const { id } = await params;
  const m = await prisma.mission.findFirst({ where: { id, entrepriseId: s.entrepriseId }, include: { presentations: { include: { candidat: true }, orderBy: { envoyeAt: "desc" } } } });
  if (!m) notFound();
  return (
    <>
      <EnTete titre={`${m.reference} · ${m.poste}`} sous={<><Pastille def={STATUTS_MISSION[m.statut]} /> · {m.lieu} · {m.contrat} · {fourchette(m.salaireMin, m.salaireMax)}</>} />
      {(m.description || m.competences.length > 0) && (
        <Carte titre="Le besoin">
          {m.description && <p className="whitespace-pre-line">{m.description}</p>}
          {m.competences.length > 0 && <p className="mt-3 text-sm text-gray-600">Compétences : {m.competences.join(", ")}</p>}
        </Carte>
      )}
      <Carte titre={`Candidats présentés (${m.presentations.length})`}>
        <ul className="divide-y">
          {m.presentations.map((p) => (
            <li key={p.id} className="py-3 flex justify-between gap-3">
              <Link href={`/client/candidats/${p.id}`} className="text-violet-700 font-semibold hover:underline">{p.candidat.prenom} {p.candidat.nom} <span className="text-sm text-gray-500 font-normal">· {formatDate(p.envoyeAt)}</span></Link>
              <Pastille def={STATUTS_PRESENTATION[p.statut]} />
            </li>
          ))}
          {m.presentations.length === 0 && <li className="py-3 text-gray-500">Pas encore de candidat présenté sur cette mission.</li>}
        </ul>
      </Carte>
    </>
  );
}
