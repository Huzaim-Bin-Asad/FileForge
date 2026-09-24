import { redirect } from "next/navigation";
import Hero from "@/components/site/Hero";
import Workflow from "@/components/site/Workflow";
import Tools from "@/components/site/Tools";
import Features from "@/components/site/Features";
import ApiSection from "@/components/site/ApiSection";
import DashboardPreview from "@/components/site/DashboardPreview";
import Pricing from "@/components/site/Pricing";
import Faq from "@/components/site/Faq";
import { getSessionUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

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
