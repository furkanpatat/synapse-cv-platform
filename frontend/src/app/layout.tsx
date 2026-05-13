import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Synapse — AI ile CV Doğrulama",
  description:
    "CV'nin gerçekliğini AI ile doğrula. GitHub kanıtıyla her yetkinliği eşleştir, 0-100 arası tek bir skorda.",
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
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
