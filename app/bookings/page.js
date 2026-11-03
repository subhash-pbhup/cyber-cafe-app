"use client";
import { useState, useEffect } from "react";

export default function BookingPage() {
  const [computers, setComputers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time and Date State
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Modal State for Customer Details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPc, setSelectedPc] = useState(null);

  // Customer Details Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3500);
  };

  // Initial Date & Time Setup
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setMinDate(todayStr);

    const updateCurrentDateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentFormattedTime = `${hours}:${minutes}`;

      setDate((prevDate) => prevDate || todayStr);
      setStartTime((prev) => prev || currentFormattedTime);

      if (!endTime) {
        const endNow = new Date(now.getTime() + 60 * 60 * 1000);
        const endHours = String(endNow.getHours()).padStart(2, "0");
        const endMinutes = String(endNow.getMinutes()).padStart(2, "0");
        setEndTime(`${endHours}:${endMinutes}`);
      }
    };

    updateCurrentDateTime();
    fetchComputers();
  }, []);

  // 5 Seconds Live Polling for both Time and Data Sync
  useEffect(() => {
    if (!date) return;

    fetchBookingsByDate(date);

    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setStartTime(`${hours}:${minutes}`);

      fetchBookingsByDate(date);
    }, 5000); // Har 5 seconds mein auto-update

    return () => clearInterval(interval);
  }, [date]);

  const fetchComputers = async () => {
    try {
      const res = await fetch("/api/computers", { cache: "no-store" });
      const data = await res.json();
      const activeComputers = (data || []).filter(
        (pc) => pc.isActive !== false,
      );
      setComputers(activeComputers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching computers:", error);
      setLoading(false);
    }
  };

  const fetchBookingsByDate = async (selectedDate) => {
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const checkIsBooked = (pcId) => {
    if (!startTime || !endTime) return false;
    return bookings.some((booking) => {
      if (booking.computerId !== pcId) return false;

      // Agar booking CANCELLED ya COMPLETED hai toh slot free mana jayega
      if (booking.status === "CANCELLED" || booking.status === "COMPLETED")
        return false;

      return (
        (booking.status === "CONFIRMED" || booking.status === "PENDING") &&
        startTime < booking.endTime &&
        endTime > booking.startTime
      );
    });
  };

  const handlePcClick = (pc) => {
    if (!date || !startTime || !endTime) {
      return showToast(
        "Missing Information: Please select a Date, Start Time, and End Time first.",
      );
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (date === today && startTime < currentTime) {
      return showToast(
        "Invalid Time: You cannot book a time slot in the past. Please select a future Start Time.",
      );
    }

    if (endTime <= startTime) {
      return showToast(
        "Invalid Duration: End Time must be later than Start Time.",
      );
    }

    if (checkIsBooked(pc._id)) {
      return showToast(
        "Slot Unavailable: This system is already booked for the selected time.",
      );
    }

    setSelectedPc(pc);
    setIsModalOpen(true);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          computerId: selectedPc._id,
          computerName: selectedPc.name,
          customerName,
          customerPhone,
          idNumber,
          date,
          startTime,
          endTime,
          status: "CONFIRMED",
          bookingType: "OFFLINE",
        }),
      });

      if (res.ok) {
        showToast("Success: Booking confirmed successfully!", "success");
        fetchBookingsByDate(date);
        closeModal();
      } else {
        const errorData = await res.json();
        showToast(
          errorData.message || "Error: Booking failed. Please try again.",
        );
      }
    } catch (error) {
      showToast(
        "Server Error: Unable to process the request. Please try again later.",
      );
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPc(null);
    setCustomerName("");
    setCustomerPhone("");
    setIdNumber("");
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-100 relative overflow-hidden">
      {toast.show && (
        <div
          className={`fixed top-8 right-8 z-[100] max-w-sm px-6 py-4 rounded-xl shadow-2xl font-semibold text-white animate-in slide-in-from-top-10 fade-in duration-300 flex items-center gap-3 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              className="w-6 h-6 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-6 h-6 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          )}
          <span className="text-sm leading-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">
            New Booking
          </h1>
          <p className="text-slate-500 mt-1">
            Select time and choose an available PC (Live Auto-Synced Every 5s)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Booking Date
          </label>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
      </div>

      <div className="flex gap-6 mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-sm border border-emerald-600"></div>
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            Available
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-rose-500 rounded-full shadow-sm border border-rose-600"></div>
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            Booked
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium animate-pulse">
          Loading systems...
        </div>
      ) : computers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No active systems available.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {computers.map((pc) => {
            const isBooked = checkIsBooked(pc._id);
            return (
              <div
                key={pc._id}
                onClick={() => handlePcClick(pc)}
                className={`group flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md
                  ${
                    isBooked
                      ? "border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800"
                      : "border-emerald-200 bg-emerald-50 hover:bg-emerald-500 hover:border-emerald-500 text-emerald-800 hover:text-white"
                  }`}
              >
                <svg
                  className={`w-14 h-14 mb-3 transition-colors duration-300 ${isBooked ? "text-rose-400" : "text-emerald-500 group-hover:text-white"}`}
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
                <span className="text-xl font-extrabold tracking-tight">
                  {pc.name}
                </span>
                <span
                  className={`text-sm font-medium mt-1 px-2 py-1 rounded-md ${isBooked ? "bg-rose-200/50" : "bg-emerald-200/50 group-hover:bg-emerald-600"}`}
                >
                  ₹{pc.hourlyRate}/hr
                </span>

                {isBooked && (
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm transform -rotate-12">
                      BOOKED
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white text-center relative">
              <h2 className="text-2xl font-bold">Confirm Booking</h2>
              <p className="text-blue-100 mt-1">
                {selectedPc?.name} • {startTime} to {endTime}
              </p>
            </div>

            <form onSubmit={submitBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ID Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Aadhar, College ID, etc."
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-1/2 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition"
                >
                  Book Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
