import Link from "next/link";
import { LearnerLoginForm } from "@/components/client/LoginForms";
import { AppPreview, Wordmark } from "@/components/ui/Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";

export const metadata = { title: "Learner login" };

export default function LearnerLogin() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/" className="no-underline"><Wordmark /></Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-5 pb-12 md:grid-cols-2 md:gap-14">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="eyebrow">Learner login</p>
            <h1 className="text-[2rem] sm:text-4xl">Log in to start.</h1>
            <p className="text-muted">You need two codes from your teacher: one for your school, one for you. Your answers save as you go, so you can stop and come back.</p>
          </div>
          <LearnerLoginForm />
        </section>
        <AppPreview className="hidden md:block" />
      </main>
    </div>
  );
}
