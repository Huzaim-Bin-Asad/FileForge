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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await getSessionUser();
  const { view } = await searchParams;

  // A signed-in visit to bare "/" (typed in, or the logo) goes to the
  // dashboard instead of the landing page — see the auth-flow fix this
  // came from. But a `#pricing`-style hash is never sent to the server at
  // all, so a link meant to show a signed-in user one specific section
  // (e.g. Settings → Billing → "See what's planned") would otherwise be
  // indistinguishable from that cold visit and get redirected away before
  // the browser ever gets a chance to scroll to it. `?view=marketing` is
  // that link's way of saying "this one's deliberate" — any internal link
  // that wants a signed-in user to actually see this page adds it.
  if (user && view !== "marketing") {
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
