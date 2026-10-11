import { LogoutButton } from "@/components/client/LoginForms";
import { StaffNav, type NavItem } from "@/components/client/StaffNav";
import { ThemeToggle } from "@/components/client/ThemeToggle";
import { Icon, Wordmark } from "./Brand";

const ICON_FOR: [RegExp, string][] = [
  [/consent/i, "check"], [/privacy/i, "shield"],
  [/review|queue/i, "inbox"], [/safeguard|alert/i, "shield"], [/setting|school|import/i, "settings"],
  [/cohort|result|dashboard/i, "chart"], [/learner|student/i, "users"],
];
const iconFor = (label: string) => ICON_FOR.find(([re]) => re.test(label))?.[1] ?? "doc";

/**
 * Staff and school workspace: a stable navigation edge and a working field. Sidebar on desktop,
 * tab strip on phones.
 */
export function StaffShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: React.ReactNode }) {
  const items: NavItem[] = nav.map((n) => ({ ...n, icon: iconFor(n.label) }));
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface p-4 lg:flex">
        <div className="px-1 pt-1"><Wordmark sub="School Edition" /></div>
        <StaffNav items={items} variant="side" />
        <div className="mt-auto flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton className="btn-ghost !min-h-11 flex-1 !px-3 !py-2 text-sm" />
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-surface px-4 pt-3 lg:hidden">
          <div className="flex items-center justify-between pb-3">
            <Wordmark />
            <div className="flex items-center gap-2"><ThemeToggle /><LogoutButton className="btn-ghost !min-h-11 !px-3 !py-2 text-sm" /></div>
          </div>
          <StaffNav items={items} variant="tabs" />
        </header>
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-10 lg:py-9">
          <h1 className="text-[1.75rem] sm:text-3xl">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}

export const STAFF_NAV = [
  { href: "/staff", label: "Review queue" },
  { href: "/staff/safeguarding", label: "Safeguarding" },
  { href: "/staff/privacy", label: "Privacy requests" },
];
export { Icon };
