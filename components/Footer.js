"use client";
import { useState, useEffect } from "react";

export default function Footer() {
  const [year, setYear] = useState(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-white text-slate-500 py-4 border-t border-slate-200 shrink-0 z-10 relative">
      <div className="w-full px-4 sm:px-6 text-center flex flex-col sm:flex-row justify-center sm:justify-between items-center max-w-7xl mx-auto">
        <p className="font-medium text-sm mb-1 sm:mb-0">
          © {year} <span className="font-bold text-[#0f2557]">Sanskar Cyber Cafe</span>. All rights reserved.
        </p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1 sm:mt-0">
          Dwivedi Market, Sangam Chauraha, Lalganj Ajhara, Pratapgarh
        </p>
      </div>
    </footer>
  );
}