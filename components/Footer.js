"use client";
import { useState, useEffect } from "react";

export default function Footer() {
  const [year, setYear] = useState(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    // 'mt-auto' hata diya gaya hai jisse margin ki wajah se scrollbar na aaye
    <footer className="bg-white text-slate-500 py-4 border-t border-slate-200 shrink-0 z-10 relative">
      <div className="w-full px-4 sm:px-6 text-center sm:flex sm:justify-between sm:items-center max-w-7xl mx-auto">
        <p className="font-medium text-sm mb-1 sm:mb-0">
          © {year} CyberCafe Manager. All rights reserved.
        </p>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Secure Admin Panel
        </p>
      </div>
    </footer>
  );
}
