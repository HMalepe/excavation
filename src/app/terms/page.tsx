import { LegalPage } from "@/components/ui/LegalPage";
import { TERMS } from "@/lib/legal/content";

export const metadata = { title: TERMS.title };
export default function Page() { return <LegalPage doc={TERMS} />; }
