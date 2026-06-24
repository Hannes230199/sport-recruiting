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
      <body className="min-h-screen bg-white antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-100">
          <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-slate-400">
            SportRecruiting.de – Deine Sport-Jobbörse. Täglich aktualisiert.
          </div>
        </footer>
      </body>
    </html>
  );
}
