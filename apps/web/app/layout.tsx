import type { Metadata } from "next";
import { Figtree, Syne, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      // The inline theme script below sets data-theme/style on <html> before
      // hydration, so the server and client attributes intentionally differ.
      suppressHydrationWarning
      className={`${figtree.variable} ${syne.variable} ${geistMono.variable} h-full bg-surface antialiased`}
    >
      <head>
        {/*
          Applies a saved dark/custom appearance before first paint, so the
          app shell doesn't flash light-then-dark on load. Deliberately tiny
          inline JS, not a lib/appearance.ts import — it has to run
          synchronously in <head>, before any bundle exists. It only sets
          the three highest-impact properties directly; the derived ones
          (--surface-elevated, --ember-deep, --ember-soft) are filled in a
          moment later by AppearanceProvider once React mounts — a one-frame
          gap on just those, not a flash of the wrong theme. Marketing/auth
          pages override this via ForceLightTheme regardless of what's cached.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem("ff-theme");
              if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);
              var raw=localStorage.getItem("ff-appearance-colors");
              if(raw){var c=JSON.parse(raw);if(c&&c.background&&c.accent&&c.text){
                document.documentElement.setAttribute("data-theme","light");
                var s=document.documentElement.style;
                s.setProperty("--surface",c.background);
                s.setProperty("--ember",c.accent);
                s.setProperty("--ink",c.text);
              }}
            }catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-ink">
        {children}
      </body>
    </html>
  );
}
