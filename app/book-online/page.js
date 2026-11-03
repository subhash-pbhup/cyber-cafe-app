"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PublicBookingPage() {
  const CANCEL_GRACE_MINUTES =
    Number(process.env.NEXT_PUBLIC_CANCEL_GRACE_MINUTES) || 10;

  const [computers, setComputers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minDate, setMinDate] = useState("");

  const [selectedPC, setSelectedPC] = useState(null);
  const [duration, setDuration] = useState(1);
  const [ticket, setTicket] = useState(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    date: "",
    startTime: "",
  });

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setMinDate(todayStr);

    const updateCurrentTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 2);

      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");

      setFormData((prev) => ({
        ...prev,
        date: todayStr,
        startTime:
          prev.startTime &&
          prev.startTime !==
            `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`
            ? prev.startTime
            : `${hours}:${mins}`,
      }));
    };

    updateCurrentTime();
    fetchData();

    const interval = setInterval(() => {
      updateCurrentTime();
      fetchData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [compRes, bookRes] = await Promise.all([
        fetch("/api/computers", { cache: "no-store"}),
        fetch("/api/bookings", { cache: "no-store" }),
      ]);
      const compData = await compRes.json();
      const bookData = await bookRes.json();

      const now = new Date();
      const activeBookings = [];

      for (const b of bookData) {
        if (b.bookingType === "ONLINE" && b.status === "PENDING") {
          const [year, month, day] = b.date.split("-").map(Number);
          const [hours, mins] = b.startTime.split(":").map(Number);
          const bStartDateTime = new Date(year, month - 1, day, hours, mins, 0);
          const graceTime = new Date(
            bStartDateTime.getTime() + CANCEL_GRACE_MINUTES * 60000,
          );

          if (now > graceTime) {
            fetch("/api/bookings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: b._id, status: "CANCELLED" }),
            }).catch((err) => console.error(err));
            continue;
          }
        }
        activeBookings.push(b);
      }

      setComputers(compData);
      setBookings(activeBookings);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateEndTime = (start, hours) => {
    if (!start) return "";
    let [h, m] = start.split(":").map(Number);
    h = (h + hours) % 24;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
  };

  const checkIsAvailable = (pcName) => {
    const pc = computers.find((c) => c.name === pcName);
    if (!pc) return false;
    if (pc.status && pc.status.toLowerCase() === "maintenance") return false;

    const timeToMins = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const selStart = timeToMins(formData.startTime);
    const selEnd = selStart + duration * 60;

    const isOverlapping = bookings.some((b) => {
      if (b.computerName !== pcName) return false;
      if (b.date !== formData.date) return false;
      if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;

      const bStart = timeToMins(b.startTime);
      let bEnd = timeToMins(b.endTime);
      if (bEnd <= bStart) bEnd += 24 * 60;

      return selStart < bEnd && selEnd > bStart;
    });
    return !isOverlapping;
  };

  useEffect(() => {
    if (selectedPC && !checkIsAvailable(selectedPC.name)) setSelectedPC(null);
  }, [formData.date, formData.startTime, duration, bookings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPC)
      return alert("Kripya koi Available (Green) PC select karein!");

    if (!formData.customerPhone || formData.customerPhone.length < 10) {
      return alert("Kripya ek valid 10-digit mobile number darj karein.");
    }

    setIsSubmitting(true);
    const endTime = calculateEndTime(formData.startTime, duration);
    const totalAmount = selectedPC.hourlyRate * duration;

    const bookingPayload = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      computerId: selectedPC._id,
      computerName: selectedPC.name,
      date: formData.date,
      startTime: formData.startTime,
      endTime: endTime,
      idNumber: "Online Booking",
      amount: totalAmount,
      totalAmount: totalAmount,
      status: "PENDING",
      bookingType: "ONLINE",
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      if (res.ok) {
        setTicket({
          ...bookingPayload,
          duration: duration,
          rate: selectedPC.hourlyRate,
          bookingId: "CC-" + Math.floor(100000 + Math.random() * 900000),
          timestamp: new Date().toLocaleString(),
        });
        fetchData();

        setTimeout(() => {
          window.print();
        }, 600);
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Booking failed.");
      }
    } catch (error) {
      alert("Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setTicket(null);
    setSelectedPC(null);
    setFormData({ ...formData, customerName: "", customerPhone: "" });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden w-full box-border">
      {/* Sticky Header */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 print:hidden w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg
              className="w-8 h-8 text-blue-500"
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
            <h1 className="text-2xl font-extrabold tracking-wide text-white">
              Cyber<span className="text-blue-500">Cafe</span>
            </h1>
          </div>
          <Link
            href="/login"
            className="text-sm font-bold text-slate-400 hover:text-white transition"
          >
            Admin Login &rarr;
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
        {ticket ? (
          <div className="max-w-md mx-auto mt-6 w-full">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-5 rounded-t-2xl text-center print:hidden">
              <h2 className="text-2xl font-extrabold text-white">
                Booking Confirmed!
              </h2>
              <p className="text-xs mt-1 text-emerald-300">
                Receipt download dialog triggered automatically. Auto-cancels if{" "}
                {CANCEL_GRACE_MINUTES} mins late.
              </p>
            </div>

            <div className="bg-slate-900 border-x border-b border-slate-800 rounded-b-2xl p-6 relative shadow-2xl print:shadow-none print:border print:border-slate-300 print:rounded-2xl print:bg-white print:text-slate-900">
              <div className="absolute top-[-10px] left-[-10px] w-6 h-6 bg-[#0a0f1c] rounded-full print:hidden"></div>
              <div className="absolute top-[-10px] right-[-10px] w-6 h-6 bg-[#0a0f1c] rounded-full print:hidden"></div>
              <div className="w-full border-t-2 border-dashed border-slate-700 absolute top-0 left-0 print:border-slate-300"></div>

              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Selected System
                  </p>
                  <p className="text-4xl font-black text-blue-500 my-1 print:text-blue-700">
                    {ticket.computerName}
                  </p>
                  <p className="text-slate-400 text-sm">
                    ₹{ticket.rate} / hour
                  </p>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-2xl grid grid-cols-2 gap-4 print:bg-slate-100">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">
                      Name
                    </p>
                    <p className="font-bold text-white text-sm print:text-slate-800">
                      {ticket.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">
                      Phone
                    </p>
                    <p className="font-bold text-white text-sm print:text-slate-800">
                      {ticket.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">
                      Date
                    </p>
                    <p className="font-bold text-white text-sm print:text-slate-800">
                      {ticket.date.split("-").reverse().join("-")}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">
                      Time Slot
                    </p>
                    <p className="font-bold text-white text-sm print:text-slate-800">
                      {formatTime(ticket.startTime)} -{" "}
                      {formatTime(ticket.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-800 pt-6 print:border-slate-300">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">
                      Total Time
                    </p>
                    <p className="text-lg font-bold text-white print:text-slate-800">
                      {ticket.duration} {ticket.duration > 1 ? "Hours" : "Hour"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-xs font-bold uppercase">
                      Estimated Bill
                    </p>
                    <p className="text-2xl font-black text-emerald-400 print:text-emerald-600">
                      ₹{ticket.totalAmount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="print:hidden flex gap-3 pt-6 mt-6 border-t border-slate-800">
                <button
                  onClick={() => window.print()}
                  className="w-1/2 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-lg text-sm flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    ></path>
                  </svg>
                  Download / Print
                </button>
                <button
                  onClick={resetBooking}
                  className="w-1/2 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition text-sm"
                >
                  Book Another
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start w-full">
            <div className="lg:w-3/5 w-full bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
              <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">
                    Select Your System
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Apni pasand ka PC (Seat) chunein
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-bold uppercase tracking-wider bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>{" "}
                    Available
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></span>{" "}
                    Occupied
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center animate-pulse gap-3 text-slate-500">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="font-bold tracking-widest text-xs uppercase">
                    Scanning Systems...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {computers.map((pc) => {
                    const isAvailable = checkIsAvailable(pc.name);
                    const isSelected = selectedPC?.name === pc.name;
                    return (
                      <div
                        key={pc._id}
                        onClick={() => isAvailable && setSelectedPC(pc)}
                        className={`relative p-5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${!isAvailable ? "bg-red-950/20 border-red-900/30 opacity-60 cursor-not-allowed" : isSelected ? "bg-blue-600/10 border-blue-500 cursor-pointer shadow-[0_0_30px_rgba(59,130,246,0.15)] transform scale-105" : "bg-slate-950 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 cursor-pointer"}`}
                      >
                        <svg
                          className={`w-12 h-12 mb-3 transition-colors ${!isAvailable ? "text-red-500/50" : isSelected ? "text-blue-500" : "text-slate-600"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          ></path>
                        </svg>
                        <p
                          className={`font-black text-lg ${isSelected ? "text-white" : "text-slate-300"}`}
                        >
                          {pc.name}
                        </p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          ₹{pc.hourlyRate}/hr
                        </p>
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-red-900/10 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                            <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg transform -rotate-12 tracking-widest border border-red-400">
                              Booked
                            </span>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:w-2/5 w-full">
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden sticky top-24">
                <h3 className="text-2xl font-extrabold text-white mb-6">
                  Booking Details
                </h3>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5 relative z-10"
                >
                  <div
                    className={`p-4 rounded-2xl border-2 transition-all ${selectedPC ? "bg-blue-600/10 border-blue-500/30" : "bg-slate-950 border-slate-800 border-dashed flex items-center justify-center h-20"}`}
                  >
                    {selectedPC ? (
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                            System Selected
                          </p>
                          <p className="text-2xl font-black text-white">
                            {selectedPC.name}
                          </p>
                        </div>
                        <div className="text-right bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                            Rate
                          </p>
                          <p className="text-lg font-bold text-white leading-none">
                            ₹{selectedPC.hourlyRate}
                            <span className="text-xs text-slate-500">/hr</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm font-bold text-center">
                        Tap on an available system to select
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="customerPhone"
                        required
                        maxLength="10"
                        value={formData.customerPhone}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        min={minDate}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Arrival Time
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        required
                        value={formData.startTime}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex justify-between">
                      <span>How long will you play?</span>
                      {formData.startTime && (
                        <span className="text-blue-400">
                          Ends at{" "}
                          {formatTime(
                            calculateEndTime(formData.startTime, duration),
                          )}
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setDuration(hours)}
                          className={`py-3 rounded-xl font-black text-sm border transition ${duration === hours ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300"}`}
                        >
                          {hours} HR
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedPC}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-extrabold text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center px-6"
                    >
                      <span>
                        {isSubmitting ? "Reserving..." : "Confirm Booking"}
                      </span>
                      {selectedPC && !isSubmitting && (
                        <span>₹{selectedPC.hourlyRate * duration}</span>
                      )}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4 font-medium flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        ></path>
                      </svg>
                      Payment will be collected at the cafe.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
