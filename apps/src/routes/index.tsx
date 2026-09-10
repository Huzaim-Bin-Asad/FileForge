import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Workflow } from "@/components/site/Workflow";
import { Tools } from "@/components/site/Tools";
import { Features } from "@/components/site/Features";
import { ApiSection } from "@/components/site/ApiSection";
import { DashboardPreview } from "@/components/site/DashboardPreview";
import { Pricing, Testimonials } from "@/components/site/Pricing";
import { Faq, Footer } from "@/components/site/Faq";

const title = "FileForge — Convert, Compress & OCR Any File";
const description =
  "Upload once. Convert, compress, OCR, summarize and extract data from any file with FileForge — the universal file processing platform and API.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Nav />
      <main>
        <Hero />
        <Workflow />
        <Tools />
        <Features />
        <ApiSection />
        <DashboardPreview />
        <Pricing />
        <Testimonials />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
