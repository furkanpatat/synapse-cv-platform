import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { CookieConsent } from "@/components/CookieConsent";

// metadataBase makes relative OG/Twitter URLs resolve correctly when
// LinkedIn / Slack / Twitter crawl the page from outside our origin.
// Falls back to localhost in dev so Next doesn't warn on every build.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Synapse — AI ile CV Doğrulama",
    template: "%s · Synapse",
  },
  description:
    "CV'nin gerçekliğini AI ile doğrula. GitHub kanıtıyla her yetkinliği eşleştir, 0-100 arası tek bir skorda.",
  applicationName: "Synapse",
  authors: [{ name: "Furkan Patat" }],
  keywords: [
    "CV doğrulama",
    "AI",
    "iş eşleştirme",
    "mülakat",
    "GitHub",
    "Synapse",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "Synapse",
    title: "Synapse — AI ile CV Doğrulama",
    description:
      "GitHub kanıtıyla her yetkinliği eşleştir. Mülakat hazırlığı + gerçek görüşme + AI değerlendirme.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Synapse — AI ile CV Doğrulama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Synapse — AI ile CV Doğrulama",
    description:
      "GitHub kanıtıyla doğrulanmış yetkinlikler. Mülakat hazırlığı + gerçek görüşme.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  // Don't disable user scaling — that's a hard a11y violation (WCAG 1.4.4).
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      data-theme="dark"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={
        {
          "--font-geist": GeistSans.style.fontFamily,
          "--font-geist-mono": GeistMono.style.fontFamily,
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        {/*
          Skip-to-content link — appears on first Tab press, lets
          keyboard / screen-reader users bypass nav. WCAG 2.4.1.
          The target element below must have id="main-content".
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[var(--ai-2)]"
        >
          Ana içeriğe atla
        </a>
        <div id="main-content">{children}</div>
        <ToastContainer />
        <CookieConsent />
      </body>
    </html>
  );
}
