import Link from "next/link";
import { LogoutButton } from "@/components/client/LoginForms";
import { PlainPage } from "@/components/ui/PlainPage";

export const metadata = { title: "Not today" };

/** spec 09 §3.3: "Not today" works with no penalty, and nothing is sent to the school beyond "not completed". */
export default function NotToday() {
  return (
    <PlainPage>
      <p className="eyebrow">Your call</p>
      <h1 className="text-5xl">No problem.</h1>
      <p className="text-lg text-muted">Nothing happens because you said not today. If you change your mind, log in again with the same codes.</p>
      <Link href="/learn" className="btn-ghost">Actually, let&apos;s start</Link>
      <LogoutButton className="btn-quiet self-start" />
    </PlainPage>
  );
}
