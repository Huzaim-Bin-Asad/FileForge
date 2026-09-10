import Hero from "@/components/site/Hero";
import Workflow from "@/components/site/Workflow";
import Tools from "@/components/site/Tools";
import Features from "@/components/site/Features";
import ApiSection from "@/components/site/ApiSection";
import DashboardPreview from "@/components/site/DashboardPreview";
import Pricing from "@/components/site/Pricing";
import Faq from "@/components/site/Faq";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface">
      <Hero />
      <Workflow />
      <Tools />
      <Features />
      <ApiSection />
      <DashboardPreview />
      <Pricing />
      <Faq />
    </div>
  );
}
