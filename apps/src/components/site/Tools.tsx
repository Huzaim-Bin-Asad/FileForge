import {
  ArrowUpRight,
  Binary,
  Braces,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  Fingerprint,
  Hash,
  Link2,
  Presentation,
  Receipt,
  Regex,
  ScanText,
  Sparkles,
  Table2,
  UserRoundCheck,
} from "lucide-react";
import { GlassCard, Section, SectionHeading } from "./primitives";

type Tool = { Icon: typeof FileText; title: string; desc: string };

const groups: { category: string; tone: string; tools: Tool[] }[] = [
  {
    category: "Documents",
    tone: "text-indigo",
    tools: [
      { Icon: FileText, title: "PDF → Word", desc: "Editable DOCX with layout fidelity." },
      { Icon: FileType2, title: "Word → PDF", desc: "Print-ready export with fonts embedded." },
      { Icon: FileSpreadsheet, title: "PDF → Excel", desc: "Tables detected and typed correctly." },
      { Icon: Presentation, title: "PDF → PowerPoint", desc: "Slides rebuilt from page structure." },
      { Icon: FileImage, title: "PDF → JPG", desc: "Per-page raster at any DPI." },
      { Icon: FileImage, title: "PDF → PNG", desc: "Lossless pages with transparency." },
    ],
  },
  {
    category: "Data",
    tone: "text-cyan",
    tools: [
      { Icon: Table2, title: "JSON → CSV", desc: "Flatten nested keys automatically." },
      { Icon: FileSpreadsheet, title: "CSV → Excel", desc: "Typed columns and clean headers." },
      { Icon: FileCode2, title: "JSON → XML", desc: "Schema-aware element mapping." },
      { Icon: Braces, title: "JSON → YAML", desc: "Readable configs in one click." },
    ],
  },
  {
    category: "Developer",
    tone: "text-purple",
    tools: [
      { Icon: Fingerprint, title: "JWT Decoder", desc: "Inspect headers, claims, expiry." },
      { Icon: Regex, title: "Regex Tester", desc: "Live matching with capture groups." },
      { Icon: Hash, title: "Hash Generator", desc: "MD5, SHA-1, SHA-256, bcrypt." },
      { Icon: Binary, title: "Base64", desc: "Encode or decode text and files." },
      { Icon: Link2, title: "URL Encoder", desc: "Safe component and query encoding." },
    ],
  },
  {
    category: "OCR",
    tone: "text-sky",
    tools: [
      { Icon: ScanText, title: "Image → Text", desc: "100+ languages, handwriting aware." },
      { Icon: FileText, title: "PDF → Searchable PDF", desc: "Invisible text layer over scans." },
    ],
  },
  {
    category: "AI",
    tone: "text-emerald",
    tools: [
      { Icon: Sparkles, title: "PDF Summary", desc: "Key points with page citations." },
      { Icon: FileCode2, title: "PDF → Markdown", desc: "Clean headings, lists, and tables." },
      { Icon: Receipt, title: "Invoice → JSON", desc: "Line items, totals, tax, vendor." },
      { Icon: UserRoundCheck, title: "Resume Optimizer", desc: "ATS scoring and rewrite hints." },
    ],
  },
];

export function Tools() {
  return (
    <Section id="tools">
      <SectionHeading
        eyebrow="Popular tools"
        title={<>Every tool you were juggling, in one place</>}
        subtitle="Each tool is a preset on top of the same pipeline — so results stay consistent whether you click or call the API."
      />

      <div className="mt-16 flex flex-col gap-14">
        {groups.map((group) => (
          <div key={group.category}>
            <div className="mb-6 flex items-center gap-4">
              <h3 className={`font-display text-xl font-medium ${group.tone}`}>{group.category}</h3>
              <span className="via-border h-px flex-1 bg-linear-to-r from-transparent to-transparent" />
              <span className="text-xs text-muted-foreground">{group.tools.length} tools</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map(({ Icon, title, desc }) => (
                <GlassCard key={title} className="group flex flex-col gap-4 p-6">
                  <span className="glass-soft grid h-11 w-11 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110">
                    <Icon className={`h-5 w-5 ${group.tone}`} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h4 className="font-display text-base font-medium">{title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                  <button className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-all duration-300 group-hover:border-transparent group-hover:bg-brand group-hover:text-primary-foreground">
                    Open Tool
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
