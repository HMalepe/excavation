import type { Metadata } from "next";
import { DemoBar } from "@/components/ui/DemoBar";

export const metadata: Metadata = { title: "Demo", robots: { index: false, follow: false } };

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <DemoBar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
    </div>
  );
}
