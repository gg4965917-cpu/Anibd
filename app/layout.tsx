import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Anime Hub — аніме українською",
    template: "%s · Anime Hub",
  },
  description:
    "Anime Hub — каталог аніме українською. Вбудований плеєр, трейлери, релізи від українських студій дубляжу.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Anime Hub — аніме українською",
    description:
      "Каталог, плеєр і добірки українською — все в одному місці.",
    type: "website",
    locale: "uk_UA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Suspense fallback={<div className="h-16 border-b border-slate-900 bg-slate-950" />}>
          <Navbar />
        </Suspense>
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
