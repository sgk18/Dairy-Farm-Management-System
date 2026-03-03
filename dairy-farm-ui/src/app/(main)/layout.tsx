import Navbar from "@/components/Navbar";
import TopHeader from "@/components/TopHeader";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Navbar />
      <div className="flex-1 flex flex-col" style={{marginLeft:'208px'}}>
        <TopHeader />
        <main className="flex-1 overflow-auto" style={{paddingTop:'64px'}}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
