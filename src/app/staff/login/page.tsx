import Link from "next/link";
import { StaffLoginForm } from "@/components/client/LoginForms";
import { StrataRule, Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";

export const metadata = { title: "Staff login" };

export default function StaffLogin() {
  return (
    <div className="flex min-h-dvh flex-col bg-contours">
      <StrataRule />
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
        <Link href="/" className="no-underline"><Wordmark sub="Staff" /></Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 pb-16">
        <div className="space-y-3">
          <p className="eyebrow">Schools · Reviewers</p>
          <h1 className="text-5xl">Sign in</h1>
          <p className="text-muted">For LO teachers, school admins, safeguarding contacts and Excavation reviewers.</p>
        </div>
        <div className="card-raised"><StaffLoginForm /></div>
      </main>
    </div>
  );
}
