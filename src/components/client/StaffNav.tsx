"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Brand";

export interface NavItem { href: string; label: string; icon: string }

/** Sidebar (desktop) or tab strip (phone). The current page is marked; the link set comes from the role. */
export function StaffNav({ items, variant }: { items: NavItem[]; variant: "side" | "tabs" }) {
  const path = usePathname() ?? "";
  const active = (href: string) => path === href || (href !== "/" && path.startsWith(href + "/"));
  if (variant === "tabs") {
    return (
      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2" aria-label="Sections">
        {items.map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold no-underline ${active(n.href) ? "bg-tint text-accent-ink" : "text-muted hover:bg-sunken"}`}>
            <Icon name={n.icon} className="h-4 w-4" />{n.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="flex flex-col gap-1" aria-label="Sections">
      {items.map((n) => (
        <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.95rem] font-semibold no-underline ${active(n.href) ? "bg-tint text-accent-ink" : "text-fg hover:bg-sunken"}`}>
          <Icon name={n.icon} className="h-5 w-5" />{n.label}
        </Link>
      ))}
    </nav>
  );
}
