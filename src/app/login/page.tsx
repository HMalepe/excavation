import { LearnerLoginForm } from "@/components/client/LoginForms";

export const metadata = { title: "Learner login" };

export default function LearnerLogin() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-5 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-amber">The Excavation</p>
        <h1 className="text-3xl">Let&apos;s get you in.</h1>
      </div>
      <LearnerLoginForm />
    </main>
  );
}
