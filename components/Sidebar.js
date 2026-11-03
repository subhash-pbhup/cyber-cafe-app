"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar({ isOpen, closeSidebar }) {
  const pathname = usePathname();
  const router = useRouter(); // Router initialize kiya navigation ke liye

  // Logout Function
  const handleLogout = async () => {
    try {
      // Logout API ko call karein
      await fetch("/api/auth/logout", { method: "POST" });

      // Sidebar agar mobile par khula hai toh use band karein
      if (isOpen) closeSidebar();

      // Wapas login page par bhej dein
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Black transparent overlay mobile ke liye */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        ></div>
      )}

      {/* Responsive Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white flex flex-col h-full shrink-0 shadow-2xl md:shadow-none border-r border-slate-800 transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            <h1 className="text-xl font-extrabold tracking-wide">
              Cyber <span className="text-blue-500">Cafe</span>
            </h1>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={closeSidebar}
            className="md:hidden text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">
            Menu
          </p>
          <nav className="flex flex-col gap-2">
            <Link
              onClick={closeSidebar}
              href="/"
              className={`px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${pathname === "/" ? "bg-blue-600/10 text-blue-500 font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
              <span>Dashboard</span>
            </Link>

            <Link
              onClick={closeSidebar}
              href="/bookings"
              className={`px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${pathname === "/bookings" ? "bg-blue-600/10 text-blue-500 font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <span>Book PC</span>
            </Link>

            <Link
              onClick={closeSidebar}
              href="/history"
              className={`px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${pathname === "/history" ? "bg-blue-600/10 text-blue-500 font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <span>Booking History</span>
            </Link>

            <Link
              onClick={closeSidebar}
              href="/computer"
              className={`px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${pathname === "/computer" ? "bg-blue-600/10 text-blue-500 font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              <span>Manage Systems</span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-3 rounded-xl transition-colors flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 font-bold text-left w-full cursor-pointer"
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
              <span>Logout</span>
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800 text-sm text-slate-500 text-center md:text-left">
          <p>CyberCafe Admin v2.0</p>
        </div>
      </aside>
    </>
  );
}
