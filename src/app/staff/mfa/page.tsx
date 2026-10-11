import { redirect } from "next/navigation";
import Link from "next/link";
import { getCaller } from "@/lib/auth/guards";
import { STAFF_HOME } from "@/lib/auth/mfa";
import { MfaForm } from "@/components/client/MfaForm";
import { Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";

export const dynamic = "force-dynamic";
export const metadata = { title: "Two-step verification" };

export default async function MfaPage() {
  const c = await getCaller();
  if (!c || c.role === "learner") redirect("/staff/login");
  if (c.mfa === "ok") redirect(STAFF_HOME[c.role] ?? "/");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
        <Link href="/" className="no-underline"><Wordmark sub="Staff" /></Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 pb-16">
        <div className="space-y-3">
          <p className="eyebrow">Second step</p>
          <h1 className="text-[2rem] sm:text-4xl">{c.mfa === "enrol" ? "Set up two-step sign in" : "Enter your code"}</h1>
          <p className="text-muted">
            {c.mfa === "enrol"
              ? "Learner information needs more than a password. Set up an authenticator app (Google Authenticator, Microsoft Authenticator, Authy or 1Password) once; after that you only enter a 6-digit code when you sign in."
              : "Open your authenticator app and enter the current 6-digit code for The Excavation."}
          </p>
        </div>
        <div className="card"><MfaForm mode={c.mfa} /></div>
      </main>
    </div>
  );
}
