import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/auth/session";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <>
      <Navbar user={user} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
