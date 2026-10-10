import { StaffLoginForm } from "@/components/client/LoginForms";

export const metadata = { title: "Staff login" };

export default function StaffLogin() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-5 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-amber">The Excavation · Staff</p>
        <h1 className="text-3xl">Sign in</h1>
        <p className="text-muted">For LO teachers, school admins, safeguarding contacts and Excavation reviewers.</p>
      </div>
      <StaffLoginForm />
    </main>
  );
}
