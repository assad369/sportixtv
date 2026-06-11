import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { NoticeTicker } from "@/components/layout/NoticeTicker";
import { AdSlot } from "@/components/ads/AdSlot";
import { AdScripts } from "@/components/ads/AdScripts";
import { DeterrentProvider } from "@/components/security/DeterrentProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <NoticeTicker />
      <AdSlot placement="header" className="mx-auto w-full max-w-7xl px-4 pt-4" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
      <AdSlot placement="footer" className="mx-auto w-full max-w-7xl px-4 pb-4" />
      <Footer />
      <AdScripts />
      <DeterrentProvider />
      {/* usePathname (active-tab state) is runtime data → needs Suspense */}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
