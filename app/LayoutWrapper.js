"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

if (pathname === "/login" || pathname === "/book-online") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 w-full h-full overflow-hidden relative">
        <Header toggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Yahan 'min-h-0' add kiya gaya hai taaki extra scrollbar na aaye */}
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8 w-full">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
