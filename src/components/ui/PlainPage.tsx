import { Wordmark } from "./Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";

const WIDTH = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

/** Frame for standalone pages (paused, not today, sharing, parent link, 404): brand, theme switch, a readable column. */
export function PlainPage({ children, width = "sm", centered = true, sub }: { children: React.ReactNode; width?: keyof typeof WIDTH; centered?: boolean; sub?: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface/90">
        <div className={`mx-auto flex items-center justify-between px-5 py-3 ${WIDTH[width]}`}>
          <Wordmark sub={sub} />
          <ThemeToggle />
        </div>
      </header>
      <main className={`mx-auto flex w-full flex-1 flex-col gap-6 px-5 pb-16 ${WIDTH[width]} ${centered ? "justify-center" : "pt-10"}`}>{children}</main>
    </div>
  );
}
