import Link from "next/link";
import { LogoutButton } from "@/components/client/LoginForms";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import { StrataRule, Wordmark } from "./Brand";

export function StaffShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b-[1.5px] border-line bg-surface">
        <StrataRule />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <Wordmark sub="School Edition" />
            <nav className="flex flex-wrap gap-1 font-display text-sm font-semibold">
              {nav.map((n) => <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-fg no-underline hover:bg-sunken">{n.label}</Link>)}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton className="btn-ghost min-h-11 px-4 py-1.5 text-sm" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-4xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export const STAFF_NAV = [
  { href: "/staff", label: "Review queue" },
  { href: "/staff/safeguarding", label: "Safeguarding" },
];
