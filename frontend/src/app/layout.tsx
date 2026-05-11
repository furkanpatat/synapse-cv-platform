import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Platform",
  description: "AI Destekli CV Doğrulama ve Yetkinlik Analiz Platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
