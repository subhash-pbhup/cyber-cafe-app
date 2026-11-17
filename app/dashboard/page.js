"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [pcs, setPcs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(null);

  useEffect(() => {
    setCurrentTime(new Date());
    fetchDashboardData();

    // Live Polling - Har 10 seconds mein dashboard data aur status auto-refresh honge
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [pcRes, bookingRes] = await Promise.all([
        fetch("/api/computers", { cache: "no-store" }).catch(() => null),
        fetch("/api/bookings", { cache: "no-store" }).catch(() => null),
      ]);

      if (pcRes && pcRes.ok) {
        const pcData = await pcRes.json();
        setPcs(pcData || []);
      }

      if (bookingRes && bookingRes.ok) {
        const bookingData = await bookingRes.json();
        setBookings(bookingData || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  // Helper: History page ki tarah exact same Dynamic Status logic
  const getDynamicStatus = (booking, checkTime) => {
    if (booking.status === "CANCELLED")
      return {
        text: "CANCELLED",
        color: "bg-red-100 text-red-700 border-red-200",
      };

    if (booking.status === "COMPLETED")
      return {
        text: "COMPLETED",
        color: "bg-slate-100 text-slate-600 border-slate-300",
      };

    if (booking.status === "PENDING")
      return {
        text: "PENDING",
        color: "bg-amber-100 text-amber-700 border-amber-200",
      };

    if (!checkTime)
      return {
        text: booking.status,
        color:
          booking.status === "CONFIRMED"
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : "bg-slate-100 text-slate-600 border-slate-300",
      };

    const endDateTime = new Date(`${booking.date}T${booking.endTime}`);
    if (checkTime > endDateTime && booking.status === "CONFIRMED")
      return {
        text: "COMPLETED",
        color: "bg-slate-100 text-slate-600 border-slate-300",
      };
    return {
      text: "CONFIRMED",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  };

  // Live Stats aur Feed calculation
  const dashboardData = useMemo(() => {
    // FIX: Fallback to a stable client-side date inside useMemo to prevent SSR evaluation mismatch
    const now = currentTime || (typeof window !== "undefined" ? new Date() : new Date(0));
    
    const dynamicBookings = bookings.map((b) => ({
      ...b,
      dynamicStatus: getDynamicStatus(b, currentTime),
    }));

    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const todaysData = dynamicBookings.filter((b) => b.date === today);
    const activeCount = dynamicBookings.filter(
      (b) => b.dynamicStatus.text === "CONFIRMED",
    ).length;
    const completedCount = todaysData.filter(
      (b) => b.dynamicStatus.text === "COMPLETED",
    ).length;

    const recent = [...dynamicBookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    return {
      stats: {
        totalPCs: pcs.length,
        activeBookings: activeCount,
        todaysBookings: todaysData.length,
        completedToday: completedCount,
      },
      recentBookings: recent,
    };
  }, [bookings, pcs, currentTime]);

  const { stats, recentBookings } = dashboardData;

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="text-slate-500 font-bold text-sm tracking-wide animate-pulse">
            LOADING DASHBOARD...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 rounded-3xl p-8 sm:p-10 shadow-xl shadow-blue-900/10 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              Welcome to CyberCafe
            </h1>
            <p className="text-blue-100 font-medium text-lg max-w-xl leading-relaxed">
              Monitor your systems, track live bookings, and manage your daily
              cafe operations from one beautiful hub.
            </p>
          </div>
          <div className="hidden lg:block bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[140px]">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
              Today's Date
            </p>
            <p className="text-xl font-extrabold">
              {currentTime ? currentTime.toLocaleDateString("en-GB") : "..."}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-40 w-32 h-32 bg-blue-300 opacity-20 rounded-full blur-2xl"></div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
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
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mb-1">
            {stats.totalPCs}
          </p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Total Systems
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            {stats.activeBookings > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mb-1">
            {stats.activeBookings}
          </p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Active Now
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mb-1">
            {stats.todaysBookings}
          </p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Today's Bookings
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mb-1">
            {stats.completedToday}
          </p>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Completed Today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Quick Actions
          </h2>

          <Link
            href="/bookings"
            className="group block bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
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
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  New Booking
                </h3>
                <p className="text-slate-500 text-xs font-medium mt-0.5">
                  Start a new session instantly.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/history"
            className="group block bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600">
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Booking History
                </h3>
                <p className="text-slate-500 text-xs font-medium mt-0.5">
                  Extend, edit, or manage bills.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                Recent Activity
              </h2>
              <Link
                href="/history"
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                View All History &rarr;
              </Link>
            </div>

            <div className="p-6 flex-1">
              {recentBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                  <p className="font-medium">No recent bookings found today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all gap-4 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 text-blue-600 font-extrabold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {booking.computerName}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {booking.customerName}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            <span className="text-slate-400">
                              {booking.date.split("-").reverse().join("-")}
                            </span>{" "}
                            • {formatTime(booking.startTime)} to{" "}
                            {formatTime(booking.endTime)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg border ${booking.dynamicStatus.color}`}
                        >
                          {booking.dynamicStatus.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}