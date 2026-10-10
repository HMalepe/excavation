import Link from "next/link";
import { LearnerLoginForm } from "@/components/client/LoginForms";
import { StrataHero, StrataRule, Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";

export const metadata = { title: "Learner login" };

export default function LearnerLogin() {
  return (
    <div className="flex min-h-dvh flex-col">
      <StrataRule />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="no-underline"><Wordmark /></Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-5 pb-12 md:grid-cols-2 md:gap-14">
        <div className="card-raised order-2 overflow-hidden p-0 md:order-1">
          <StrataHero depth={0} crop className="block h-44 w-full md:h-auto" />
        </div>
        <section className="order-1 space-y-6 md:order-2">
          <div className="space-y-3">
            <p className="eyebrow">Start at the surface</p>
            <h1 className="text-5xl">Let&apos;s get you in.</h1>
            <p className="text-muted">Two codes, both from your teacher. Everything you do is saved as you go.</p>
          </div>
          <LearnerLoginForm />
        </section>
      </main>
    </div>
  );
}
