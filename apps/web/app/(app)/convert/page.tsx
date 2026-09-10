import ConverterSection from "@/components/converter-section/ConverterSection";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Convert | FileForge",
  description: "Convert PDF, Word, Excel, PowerPoint, Markdown, HTML and more.",
};

export default function ConvertPage() {
  return (
    <WorkspaceShell
      title="Converter"
      subtitle="Files are processed inside FileForge and never uploaded to another service. Sign in to keep a history of what you converted."
    >
      <div className="max-w-2xl">
        <ConverterSection />
      </div>
    </WorkspaceShell>
  );
}
