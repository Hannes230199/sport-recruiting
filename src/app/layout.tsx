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
      <body className="min-h-screen bg-slate-50 antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
            SportRecruiting.de – Jobs aus JobsImSport, DSHS Köln, SPOBIS Jobs,
            Sport-Job.com und Joborama, täglich aktualisiert.
          </div>
        </footer>
      </body>
    </html>
  );
}
