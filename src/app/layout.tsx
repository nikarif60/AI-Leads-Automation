import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "AI Lead Finder", template: "%s | AI Lead Finder" },
  description: "NykStack's personal Malaysian lead research dashboard.",
  applicationName: "Lead Finder",
  appleWebApp: { capable: true, title: "Lead Finder", statusBarStyle: "black-translucent" },
  openGraph: { title: "AI Lead Finder", description: "NykStack lead operations dashboard" },
  twitter: { card: "summary", title: "AI Lead Finder", description: "NykStack lead operations dashboard" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
