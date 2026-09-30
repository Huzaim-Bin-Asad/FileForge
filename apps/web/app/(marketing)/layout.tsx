import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/auth/session";
import ForceLightTheme from "@/components/appearance/ForceLightTheme";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <>
      <ForceLightTheme />
      <Navbar user={user} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
