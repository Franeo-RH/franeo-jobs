import { exigerClient } from "@/lib/session";
import Coquille from "@/components/Coquille";
import BandeauDemo from "@/components/BandeauDemo";
import { estSessionDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await exigerClient();
  return (
    <>
      {estSessionDemo(session) && <BandeauDemo />}
      <Coquille session={session}>{children}</Coquille>
    </>
  );
}
