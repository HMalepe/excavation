import { Wordmark, StrataRule } from "./Brand";
import { ThemeToggle } from "@/components/client/ThemeToggle";

const WIDTH = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

/**
 * Frame for standalone pages (paused, not today, sharing, the parent link): strata rule, wordmark,
 * theme switch, and a column that stays comfortable to read on a phone.
 */
export function PlainPage({ children, width = "sm", centered = true, sub }: { children: React.ReactNode; width?: keyof typeof WIDTH; centered?: boolean; sub?: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-contours">
      <StrataRule />
      <header className={`mx-auto flex w-full items-center justify-between px-5 py-4 ${WIDTH[width]}`}>
        <Wordmark sub={sub} />
        <ThemeToggle />
      </header>
      <main className={`mx-auto flex w-full flex-1 flex-col gap-6 px-5 pb-16 ${WIDTH[width]} ${centered ? "justify-center" : "pt-4"}`}>{children}</main>
    </div>
  );
}
