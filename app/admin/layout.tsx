import { exigerAdmin } from "@/lib/session";
import Coquille from "@/components/Coquille";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await exigerAdmin();
  return <Coquille session={session}>{children}</Coquille>;
}
