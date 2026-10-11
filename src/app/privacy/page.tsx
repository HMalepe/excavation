import { LegalPage } from "@/components/ui/LegalPage";
import { PRIVACY } from "@/lib/legal/content";

export const metadata = { title: PRIVACY.title };
export default function Page() { return <LegalPage doc={PRIVACY} />; }
