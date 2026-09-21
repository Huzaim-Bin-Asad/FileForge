import Link from "next/link";
import Logo from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Convert", href: "/dashboard" },
      { label: "Tools", href: "/#tools" },
      { label: "API", href: "/#api" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "History", href: "/history" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Formats",
    links: [
      { label: "PDF ↔ Word", href: "/dashboard" },
      { label: "PDF ↔ Excel", href: "/dashboard" },
      { label: "PDF ↔ PowerPoint", href: "/dashboard" },
      { label: "Markdown & HTML", href: "/dashboard" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#ffdcc8]/15 bg-forge-deep text-[#fff8f4]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo compact />
          <p className="max-w-xs text-sm leading-relaxed text-[#ffdcc8]/70">
            Universal document conversion, private, fast, and free of
            uploads to another service.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:contents">
          {columns.map((c) => (
            <div key={c.title}>
              <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-[#ffdcc8]/40">
                {c.title}
              </p>
              <ul className="space-y-2 text-sm text-[#ffdcc8]/75">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition hover:text-[#fff8f4]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#ffdcc8]/12">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-[#ffdcc8]/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} FileForge</p>
          <p className="leading-relaxed">
            PDF · Word · Excel · PowerPoint · Markdown · HTML · TXT · EPUB
          </p>
        </div>
      </div>
    </footer>
  );
}
