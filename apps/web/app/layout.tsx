import type { Metadata } from "next";
import { Figtree, Syne, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/auth/session";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FileForge | Universal file converter",
  description:
    "Convert PDF, Word, Excel, PowerPoint, Markdown, HTML and more, fast, private, no third-party uploads.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      className={`${figtree.variable} ${syne.variable} ${geistMono.variable} h-full bg-surface antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface text-ink">
        <Navbar user={user} />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
