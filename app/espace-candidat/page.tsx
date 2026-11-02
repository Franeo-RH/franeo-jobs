import { PagePublique } from "@/components/PublicBarre";
import FormulaireEspaceCandidat from "@/components/FormulaireEspaceCandidat";

export const metadata = { title: "Mon espace candidat — Franeo Jobs" };
export const dynamic = "force-dynamic";

export default function EspaceCandidat() {
  return <PagePublique><FormulaireEspaceCandidat /></PagePublique>;
}
