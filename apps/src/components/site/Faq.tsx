import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Logo } from "./Nav";
import { Section, SectionHeading } from "./primitives";

const faqs = [
  {
    q: "What happens to my files after conversion?",
    a: "Files are encrypted at rest and automatically purged 24 hours after processing. On Business plans you can set retention to zero, meaning files never touch persistent storage.",
  },
  {
    q: "Do I have to use the AI features?",
    a: "No. AI enhancements are strictly opt-in per file, per workflow, or per API request. Conversions run through the deterministic pipeline by default.",
  },
  {
    q: "How accurate is the OCR?",
    a: "We combine layout-aware detection with language models for correction, covering 100+ languages including handwritten notes and low-quality scans.",
  },
  {
    q: "Can I convert files in bulk?",
    a: "Yes. Upload an archive or queue thousands of files through the API. Jobs run in parallel and emit a signed webhook when the batch completes.",
  },
  {
    q: "Is there a self-hosted option?",
    a: "Business customers can run FileForge inside their own VPC with a container image and a license key. Contact sales for deployment details.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <SectionHeading
          align="left"
          eyebrow="FAQ"
          title={<>Answers before you ask</>}
          subtitle="Still curious? The docs go deeper on every topic."
        />

        <Accordion type="single" collapsible className="glass gradient-border rounded-3xl px-6">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border last:border-0">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

const columns = [
  { title: "Product", links: ["Features", "Tools", "Pricing", "Dashboard", "Changelog"] },
  { title: "Resources", links: ["Docs", "Guides", "Blog", "Status", "Support"] },
  { title: "Developers", links: ["API Reference", "SDKs", "Webhooks", "Playground", "GitHub"] },
  { title: "Company", links: ["About", "Careers", "Privacy", "Terms", "Security"] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              The universal file processing platform. Convert, compress, OCR and enhance anything —
              from one place or one endpoint.
            </p>
            <div className="flex gap-2">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#top"
                  aria-label="Social link"
                  className="glass-soft grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-secondary/70"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-4">
            {columns.map((c) => (
              <div key={c.title} className="flex flex-col gap-3">
                <p className="text-sm font-medium">{c.title}</p>
                {c.links.map((l) => (
                  <a
                    key={l}
                    href="#top"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="border-border mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FileForge. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Built for teams who move fast with files.</p>
        </div>
      </div>
    </footer>
  );
}
