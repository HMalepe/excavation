import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorReporter } from "@/components/client/ErrorReporter";

// Self-hosted at build time (no request to Google from the learner's phone), latin subset only.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "The Excavation", template: "%s · The Excavation" },
  description: "Know Thy Self measures. The Excavation interprets. School Edition.",
  robots: { index: false, follow: false },
  icons: { apple: "/icons/180" },
  appleWebApp: { capable: true, title: "Excavation", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a101c" },
  ],
};

/** Applies a saved theme choice before first paint, so there's no flash. No choice = follow the phone. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
