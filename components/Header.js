"use client";
import Link from "next/link";

export default function Header({ toggleSidebar }) {
  return (
    <header className="bg-white text-slate-800 shadow-sm z-30 border-b border-slate-200 shrink-0">
      <div className="w-full px-4 sm:px-6 py-3.5 flex justify-between items-center">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 -ml-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>

          <div className="md:hidden font-extrabold tracking-wide text-lg">
            Cyber<span className="text-blue-600">Cafe</span>
          </div>
        </div>

        {/* Admin Profile Details */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 sm:p-2 rounded-xl transition-colors ml-auto border border-transparent hover:border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm">
            AD
          </div>
          <div className="hidden sm:block text-right mr-1">
            <p className="text-sm font-bold text-slate-700 leading-tight">
              Admin User
            </p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Manager
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
