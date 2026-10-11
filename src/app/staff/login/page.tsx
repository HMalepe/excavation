import Link from "next/link";
import { StaffLoginForm } from "@/components/client/LoginForms";
import { Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";

export const metadata = { title: "Staff login" };

export default function StaffLogin() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
        <Link href="/" className="no-underline"><Wordmark sub="Staff" /></Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 pb-16">
        <div className="space-y-3">
          <p className="eyebrow">Staff</p>
          <h1 className="text-[2rem] sm:text-4xl">Staff sign in</h1>
          <p className="text-muted">For LO teachers, school admins, safeguarding contacts and Excavation reviewers. Learners log in with their codes instead.</p>
        </div>
        <div className="card"><StaffLoginForm /></div>
      </main>
    </div>
  );
}
