"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

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
        fetch("/api/computers", { cache: "no-store" }),
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
            bStartDateTime.getTime() + CANCEL_GRACE_MINUTES * 60000
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
          bookingId: "SC-" + Math.floor(100000 + Math.random() * 900000),
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
    <div className="h-screen w-full overflow-hidden bg-slate-50 text-slate-800 font-sans flex flex-col print:h-auto print:overflow-visible">

      {/* HEADER */}
      <nav
        className="w-full flex-none shadow-md print:hidden border-b-4 z-50"
        style={{ backgroundColor: '#0f2557', borderBottomColor: '#f59e0b' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3">

            {/* LOGO */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center p-1 shadow-sm flex-none overflow-hidden border border-slate-200">
              <img
                src="/images/sanskar-logo.png"
                alt="Sanskar Cyber Cafe"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="font-black text-xl" style="color: #0f2557">S</span>';
                }}
              />
            </div>

            <div className="flex flex-col">
              <h1 className="text-sm sm:text-xl md:text-2xl font-extrabold tracking-wide leading-tight" style={{ color: 'white' }}>
                Sanskar <span style={{ color: '#f59e0b' }}>Cyber Cafe</span>
              </h1>
              <p className="text-[8px] sm:text-[10px] font-medium tracking-widest uppercase hidden sm:block" style={{ color: '#cbd5e1' }}>
                Lalganj Ajhara, Pratapgarh
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="text-[10px] sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors shadow-sm text-white flex-none whitespace-nowrap"
            style={{ backgroundColor: '#f59e0b' }}
          >
            Admin Login &rarr;
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT SCROLLABLE AREA */}
      <main className="flex-1 w-full overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto w-full pb-6 print:pb-0">
          {ticket ? (
            <div className="max-w-md mx-auto mt-2 sm:mt-6 w-full print:mt-0 print:max-w-full">

              {/* Success Banner (Hidden on Print) */}
              <div className="p-4 sm:p-6 rounded-t-2xl text-center print:hidden shadow-lg" style={{ backgroundColor: '#0f2557' }}>
                <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: '#f59e0b' }}>
                  Booking Confirmed!
                </h2>
                <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-slate-200">
                  Receipt download dialog triggered. Auto-cancels if{" "}
                  {CANCEL_GRACE_MINUTES} mins late.
                </p>
              </div>

              {/* RECEIPT BOX */}
              <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl p-6 sm:p-8 relative shadow-2xl print:shadow-none print:border-none print:rounded-none">

                {/* Receipt Header */}
                <div className="text-center pb-6 border-b border-dashed border-slate-300">
                  <div className="flex items-center justify-center gap-2 mb-2 print:mb-1">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 border border-slate-200 shadow-sm print:hidden">
                      <img
                        src="/images/sanskar-logo.png"
                        alt="Logo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span class="font-black text-xl" style="color: #0f2557">S</span>';
                        }}
                      />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-wide uppercase">
                      Sanskar Cyber Cafe
                    </h2>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                    Lalganj Ajhara, Pratapgarh
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Ph: +91 98765 43210
                  </p>
                </div>

                {/* Booking Info (Date & ID) */}
                <div className="flex justify-between items-start py-4 text-[11px] sm:text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase mb-0.5">Booking ID</p>
                    <p className="font-black text-slate-800">{ticket.bookingId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-bold uppercase mb-0.5">Date & Time</p>
                    <p className="font-bold text-slate-800">{ticket.timestamp}</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Customer Name</p>
                      <p className="font-bold text-slate-800 text-sm">{ticket.customerName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Phone Number</p>
                      <p className="font-bold text-slate-800 text-sm">{ticket.customerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Service Table */}
                <div className="mb-6">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-800">
                        <th className="py-2 font-black text-slate-800 uppercase tracking-wider">Description</th>
                        <th className="py-2 text-center font-black text-slate-800 uppercase tracking-wider">Qty</th>
                        <th className="py-2 text-right font-black text-slate-800 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="py-3">
                          <p className="font-bold text-slate-800">{ticket.computerName} Booking</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {ticket.date.split("-").reverse().join("-")} <br />
                            {formatTime(ticket.startTime)} - {formatTime(ticket.endTime)}
                          </p>
                        </td>
                        <td className="py-3 text-center text-slate-600 font-medium">
                          {ticket.duration} Hr
                        </td>
                        <td className="py-3 text-right text-slate-800 font-bold">
                          ₹{ticket.rate * ticket.duration}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Total Section */}
                <div className="border-t-2 border-slate-800 pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Rate per hour</p>
                    <p className="font-bold text-slate-800 text-sm">₹{ticket.rate}</p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-base font-black text-slate-800 uppercase tracking-wider">Total Bill</p>
                    <p className="text-2xl font-black" style={{ color: '#0f2557' }}>₹{ticket.totalAmount}</p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-300 pt-4">
                  <p className="font-bold text-slate-500 mb-1">Thank you for visiting!</p>
                  <p>Payment collected at the counter.</p>
                  <p>Please arrive 5 mins before your time slot.</p>
                </div>
              </div>

              {/* Action Buttons (Hidden on Print) */}
              <div className="print:hidden flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-1/2 py-3 rounded-xl font-bold transition shadow-lg text-sm flex items-center justify-center gap-2 text-white"
                  style={{ backgroundColor: '#0f2557' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                  </svg>
                  Print / Download Receipt
                </button>
                <button
                  onClick={resetBooking}
                  className="w-full sm:w-1/2 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition text-sm"
                >
                  Book Another System
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 items-start w-full">

              {/* Systems Area */}
              <div className="w-full lg:w-3/5 bg-white border border-slate-200 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm">
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-start sm:items-end border-b border-slate-100 pb-3 sm:pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: '#0f2557' }}>
                      Select Your System
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Apni pasand ka PC chunein</p>
                  </div>
                  <div className="flex gap-3 sm:gap-4 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-200 w-full sm:w-auto justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 shadow-sm"></span> Available
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 shadow-sm"></span> Occupied
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="h-48 sm:h-64 flex flex-col items-center justify-center gap-3" style={{ color: '#0f2557' }}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#0f2557' }}></div>
                    <p className="font-bold tracking-widest text-[10px] sm:text-xs uppercase">Scanning Systems...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {computers.map((pc) => {
                      const isAvailable = checkIsAvailable(pc.name);
                      const isSelected = selectedPC?.name === pc.name;
                      return (
                        <div
                          key={pc._id}
                          onClick={() => isAvailable && setSelectedPC(pc)}
                          className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 
                            ${!isAvailable ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                              : isSelected ? "bg-orange-50 cursor-pointer shadow-md transform scale-[1.02]"
                                : "bg-white border-slate-200 hover:shadow-md cursor-pointer"}`}
                          style={{ borderColor: isSelected ? '#f59e0b' : '' }}
                        >
                          <svg
                            className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 ${!isAvailable ? "text-slate-300" : ""}`}
                            style={{ color: isSelected ? '#f59e0b' : (!isAvailable ? '' : '#0f2557') }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                          <p className="font-black text-sm sm:text-lg" style={{ color: isSelected ? '#0f2557' : '#334155' }}>{pc.name}</p>
                          <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">₹{pc.hourlyRate}/hr</p>

                          {!isAvailable && (
                            <div className="absolute inset-0 bg-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                              <span className="bg-red-500 text-white text-[8px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm transform -rotate-12 tracking-widest">
                                Booked
                              </span>
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 text-white p-0.5 sm:p-1 rounded-full shadow-md" style={{ backgroundColor: '#f59e0b' }}>
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Booking Form Area */}
              <div className="w-full lg:w-2/5">
                <div className="bg-white border border-slate-200 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: '#0f2557' }}></div>
                  <h3 className="text-lg sm:text-xl font-extrabold mb-4 sm:mb-6" style={{ color: '#0f2557' }}>Booking Details</h3>

                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5 relative z-10">

                    <div className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${selectedPC ? "bg-orange-50" : "bg-slate-50 border-slate-200 border-dashed flex items-center justify-center h-16 sm:h-20"}`} style={{ borderColor: selectedPC ? 'rgba(245, 158, 11, 0.5)' : '' }}>
                      {selectedPC ? (
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1" style={{ color: '#f59e0b' }}>System Selected</p>
                            <p className="text-base sm:text-xl font-black" style={{ color: '#0f2557' }}>{selectedPC.name}</p>
                          </div>
                          <div className="text-right bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Rate</p>
                            <p className="text-sm sm:text-base font-bold leading-none" style={{ color: '#0f2557' }}>
                              ₹{selectedPC.hourlyRate}<span className="text-[10px] sm:text-xs text-slate-400">/hr</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-[10px] sm:text-sm font-bold text-center">Tap on an available system to select</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Name</label>
                        <input type="text" name="customerName" required value={formData.customerName} onChange={handleChange}
                          className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl outline-none text-slate-800 text-sm sm:text-base transition focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': '#0f2557' }} />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Phone Number</label>
                        <input type="tel" name="customerPhone" required maxLength="10" value={formData.customerPhone} onChange={handleChange}
                          className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl outline-none text-slate-800 text-sm sm:text-base transition focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': '#0f2557' }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Date</label>
                        <input type="date" name="date" required value={formData.date} onChange={handleChange} min={minDate}
                          className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl outline-none text-slate-800 text-xs sm:text-base transition focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': '#0f2557' }} />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Arrival Time</label>
                        <input type="time" name="startTime" required value={formData.startTime} onChange={handleChange}
                          className="w-full p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl outline-none text-slate-800 text-xs sm:text-base transition focus:ring-2 focus:border-transparent" style={{ '--tw-ring-color': '#0f2557' }} />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                      <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3 flex justify-between">
                        <span>Play Duration</span>
                        {formData.startTime && (
                          <span style={{ color: '#f59e0b' }}>Ends at {formatTime(calculateEndTime(formData.startTime, duration))}</span>
                        )}
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {[1, 2, 3, 4].map((hours) => (
                          <button key={hours} type="button" onClick={() => setDuration(hours)}
                            className={`py-2 sm:py-2.5 rounded-lg font-black text-[10px] sm:text-xs transition border ${duration === hours
                              ? "text-white shadow-md border-transparent"
                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                              }`}
                            style={{ backgroundColor: duration === hours ? '#0f2557' : '' }}
                          >
                            {hours} HR
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 sm:pt-2">
                      <button type="submit" disabled={isSubmitting || !selectedPC}
                        className="w-full py-3 sm:py-4 rounded-xl font-extrabold text-sm sm:text-lg text-white shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center px-4 sm:px-6"
                        style={{ backgroundColor: '#f59e0b' }}
                      >
                        <span>{isSubmitting ? "Reserving..." : "Confirm Booking"}</span>
                        {selectedPC && !isSubmitting && (
                          <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm">₹{selectedPC.hourlyRate * duration}</span>
                        )}
                      </button>
                      <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-3 sm:mt-4 font-medium flex items-center justify-center gap-1.5 sm:gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#0f2557' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                        Payment will be collected at the cafe.
                      </p>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}