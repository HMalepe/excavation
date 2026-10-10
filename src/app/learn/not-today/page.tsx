import Link from "next/link";
import { LogoutButton } from "@/components/client/LoginForms";

export const metadata = { title: "Not today" };

/** spec 09 §3.3: "Not today" works with no penalty, and nothing is sent to the school beyond "not completed". */
export default function NotToday() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <h1 className="text-3xl">No problem.</h1>
      <p>Nothing happens because you said not today. If you change your mind, log in again with the same codes.</p>
      <Link href="/learn" className="btn-ghost no-underline">Actually, let&apos;s start</Link>
      <LogoutButton />
    </main>
  );
}
