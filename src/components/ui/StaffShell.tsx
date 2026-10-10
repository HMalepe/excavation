import Link from "next/link";
import { LogoutButton } from "@/components/client/LoginForms";

export function StaffShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-ink-3 bg-ink-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-5">
            <span className="text-sm uppercase tracking-[0.2em] text-amber">The Excavation</span>
            <nav className="flex gap-4 text-sm">{nav.map((n) => <Link key={n.href} href={n.href} className="no-underline">{n.label}</Link>)}</nav>
          </div>
          <LogoutButton className="btn-ghost min-h-10 px-3 py-1 text-sm" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <h1 className="text-3xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export const STAFF_NAV = [
  { href: "/staff", label: "Review queue" },
  { href: "/staff/safeguarding", label: "Safeguarding" },
];
