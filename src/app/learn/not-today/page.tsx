import Link from "next/link";
import { LogoutButton } from "@/components/client/LoginForms";
import { Banner } from "@/components/ui/Question";
import { PlainPage } from "@/components/ui/PlainPage";

export const metadata = { title: "Not today" };

/** spec 09 §3.3: "Not today" works with no penalty, and nothing is sent to the school beyond "not completed". */
export default function NotToday() {
  return (
    <PlainPage>
      <Banner sec="direction" art="direction" />
      <p className="eyebrow">Your call</p>
      <h1 className="text-[2rem] sm:text-4xl">No problem.</h1>
      <p className="text-lg text-muted">Nothing happens because you said not today. Your school only sees &ldquo;not completed&rdquo;. If you change your mind, log in again with the same codes.</p>
      <Link href="/learn" className="btn-ghost">Actually, let&apos;s start</Link>
      <LogoutButton className="btn-quiet self-start" />
    </PlainPage>
  );
}
