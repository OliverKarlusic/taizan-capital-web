import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

/**
 * Weights 400 and 500 only.
 *
 * 600 was declared and never used — `font-semibold` appears nowhere in the
 * codebase and globals.css asks for 500. Next preloads every declared face,
 * so the two unused 600 files (normal and italic) were fetched on every
 * page and then sat there, which is what produced the console warning
 * "preloaded using link preload but not used within a few seconds".
 * Dropping them removes the warning and two font downloads.
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Canonical origin for absolute URLs in social metadata.
 *
 * LinkedIn, X and Slack all refuse relative image paths, so an Open Graph
 * card needs an absolute URL and therefore needs to know its own origin.
 * Vercel injects VERCEL_URL; NEXT_PUBLIC_SITE_URL overrides it for a
 * custom domain. The localhost fallback only applies in development.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "http://localhost:3000";

const DESCRIPTION =
  "An asset management concept built on Japanese principles of disciplined investing. Published strategy records, a market screener and company research across the ASX, NYSE and Nasdaq.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Taizan Capital — Building Generational Wealth Through Discipline",
  description: DESCRIPTION,
  keywords: [
    "asset management",
    "generational wealth",
    "disciplined investing",
    "Taizan Capital",
    "market screener",
    "equity research",
  ],
  openGraph: {
    title: "Taizan Capital — 泰山",
    description: DESCRIPTION,
    type: "website",
    siteName: "Taizan Capital",
    locale: "en_AU",
    url: SITE_URL,
    // The hero poster is the only wide, already-optimised brand image in
    // the repository, and it is the frame the site itself opens on.
    images: [
      {
        url: "/media/hero/hero-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "Taizan Capital — Mount Fuji at first light",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taizan Capital — 泰山",
    description: DESCRIPTION,
    images: ["/media/hero/hero-poster.jpg"],
  },
  robots: { index: true, follow: true },
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
      // `dark` is permanent: the brand is dark-only, so shadcn components
      // must not flip to their light theme on a light-mode OS.
      className={`lenis dark ${cormorant.variable} ${inter.variable}`}
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
