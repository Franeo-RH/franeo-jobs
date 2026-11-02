import { exigerCandidat } from "@/lib/session";
import Coquille from "@/components/Coquille";
import { PublicPied } from "@/components/PublicBarre";

export const dynamic = "force-dynamic";

export default async function CandidatLayout({ children }: { children: React.ReactNode }) {
  const s = await exigerCandidat();
  return <Coquille session={{ role: "CANDIDAT", prenom: s.prenom }} pied={<PublicPied />}>{children}</Coquille>;
}
