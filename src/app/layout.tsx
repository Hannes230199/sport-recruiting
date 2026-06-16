import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "SportRecruiting.de – Jobs & Bewerbungen im Sport",
  description:
    "Sport-Jobs aus mehreren Quellen gebündelt finden, einmal bewerben, automatisch gematcht werden – und alle Bewerbungen im Überblick behalten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#f7f8ff] antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="mt-20 border-t border-brand-100/50 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-400">
            SportRecruiting.de – Jobs aus JobsImSport, DSHS Köln, SPOBIS Jobs, Sport-Job.com und Joborama, täglich aktualisiert.
          </div>
        </footer>
      </body>
    </html>
  );
}
