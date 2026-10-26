import { connection } from "next/server";
import { LegalPage, type LegalKind } from "@/components/legal-page";
import { missingOperatorSettings, operatorInfo } from "@/lib/legal/operator";

/**
 * Reads the operator's details where the server runs, not where it was built,
 * so changing them never needs a rebuild. Render inside <Suspense>.
 */
export async function LegalDocument({ kind }: { kind: LegalKind }) {
  await connection();
  return <LegalPage kind={kind} operator={operatorInfo()} missing={missingOperatorSettings()} />;
}
