import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Taizan Capital — Building Generational Wealth Through Discipline",
  description:
    "Taizan Capital is an asset management concept built on Japanese principles of disciplined investing: kaizen, ma, and shokunin. Patience, preservation, and generational wealth.",
  keywords: [
    "asset management",
    "generational wealth",
    "disciplined investing",
    "Taizan Capital",
  ],
  openGraph: {
    title: "Taizan Capital — 泰山",
    description:
      "Wealth is not built through speculation. It is built through patience, discipline and intelligent decisions over time.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`lenis ${cormorant.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
