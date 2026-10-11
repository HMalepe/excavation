import { LegalPage } from "@/components/ui/LegalPage";
import { COOKIES } from "@/lib/legal/content";

export const metadata = { title: COOKIES.title };
export default function Page() { return <LegalPage doc={COOKIES} />; }
