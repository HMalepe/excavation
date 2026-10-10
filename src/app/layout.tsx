import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorReporter } from "@/components/client/ErrorReporter";

export const metadata: Metadata = {
  title: { default: "The Excavation", template: "%s · The Excavation" },
  description: "Know Thy Self measures. The Excavation interprets. School Edition.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f0d0a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body className="antialiased">
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
