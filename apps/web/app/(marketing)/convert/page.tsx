import ConverterSection from "@/components/converter-section/ConverterSection";

export const metadata = {
  title: "Convert | FileForge",
  description: "Convert PDF, Word, Excel, PowerPoint, Markdown, HTML and more.",
};

export default function ConvertPage() {
  return (
    <div className="bg-forge relative flex-1">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <p className="font-mono text-xs font-medium tracking-[0.18em] text-ember uppercase">
          Converter
        </p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Drop it. Pick a format. Done.
        </h1>
        <p className="mt-3 max-w-xl text-ink-muted">
          Files are processed in-app and never uploaded to a third-party service.
          Sign in to keep a history of what you converted.
        </p>
        <div className="mt-10">
          <ConverterSection />
        </div>
      </div>
    </div>
  );
}
