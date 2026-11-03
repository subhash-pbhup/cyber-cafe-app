"use client";
import { useState, useEffect, useMemo } from "react";

export default function HistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    name: "",
    phone: "",
    idNumber: "",
  });

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendData, setExtendData] = useState({
    id: "",
    startTime: "",
    oldEndTime: "",
    newEndTime: "",
  });

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billData, setBillData] = useState(null);

  const fetchData = async () => {
    try {
      const [bookRes, compRes] = await Promise.all([
        fetch("/api/bookings", { cache: "no-store" }),
        fetch("/api/computers", { cache: "no-store" }),
      ]);
      const bookData = await bookRes.json();
      const compData = await compRes.json();

      const CANCEL_GRACE_MINUTES =
        Number(process.env.NEXT_PUBLIC_CANCEL_GRACE_MINUTES) || 10;
      const now = new Date();

      const processedBookings = bookData.map((b) => {
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
            }).catch((e) => console.error(e));

            return { ...b, status: "CANCELLED" };
          }
        }
        return b;
      });

      const sortedData = processedBookings.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setBookings(sortedData || []);
      setComputers(compData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentTime(new Date());
    fetchData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
      fetchData();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const getDuration = (start, end) => {
    if (!start || !end) return "";
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    let diffMins = Math.floor((endTime - startTime) / 60000);
    if (diffMins <= 0) diffMins += 24 * 60;

    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const getDynamicStatus = (booking) => {
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

    if (!currentTime)
      return {
        text: booking.status,
        color:
          booking.status === "CONFIRMED"
            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
            : "bg-slate-100 text-slate-600 border-slate-300",
      };

    const endDateTime = new Date(`${booking.date}T${booking.endTime}`);
    if (currentTime > endDateTime && booking.status === "CONFIRMED")
      return {
        text: "COMPLETED",
        color: "bg-slate-100 text-slate-600 border-slate-300",
      };
    return {
      text: "CONFIRMED",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  };

  const stats = useMemo(() => {
    const all = bookings
      .map((b) => ({ ...b, dynamicStatus: getDynamicStatus(b) }))
      .filter((b) => (dateFilter ? b.date === dateFilter : true));

    return {
      total: all.length,
      active: all.filter((b) => b.dynamicStatus.text === "CONFIRMED").length,
      completed: all.filter((b) => b.dynamicStatus.text === "COMPLETED").length,
      cancelled: all.filter((b) => b.dynamicStatus.text === "CANCELLED").length,
    };
  }, [bookings, currentTime, dateFilter]);

  const filteredBookings = useMemo(() => {
    return bookings
      .map((b) => ({ ...b, dynamicStatus: getDynamicStatus(b) }))
      .filter((booking) => {
        const matchesSearch =
          booking.customerName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.customerPhone.includes(searchQuery) ||
          (booking.idNumber &&
            booking.idNumber
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          booking.computerName
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" || booking.dynamicStatus.text === statusFilter;

        const matchesDate = dateFilter ? booking.date === dateFilter : true;

        return matchesSearch && matchesStatus && matchesDate;
      });
  }, [bookings, searchQuery, statusFilter, dateFilter, currentTime]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const handleStartSession = async (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    const diffDays = (today - bookingDate) / (1000 * 60 * 60 * 24);
    if (diffDays > 1 || diffDays < 0) {
      return alert(
        "Aap is booking ko start nahi kar sakte kyunki ye 1 din se purani ya future ki hai.",
      );
    }

    if (!confirm("Kya customer aa gaya hai? Session abhi se start hoga."))
      return;

    const now = new Date();
    const newStartTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const [sH, sM] = booking.startTime.split(":").map(Number);
    const [eH, eM] = booking.endTime.split(":").map(Number);
    let durationMins = eH * 60 + eM - (sH * 60 + sM);
    if (durationMins <= 0) durationMins += 24 * 60;

    let newEndMins = now.getHours() * 60 + now.getMinutes() + durationMins;
    const newEndTime = `${String(Math.floor(newEndMins / 60) % 24).padStart(2, "0")}:${String(newEndMins % 60).padStart(2, "0")}`;

    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking._id,
          action: "START_SESSION",
          startTime: newStartTime,
          endTime: newEndTime,
        }),
      });
      if (res.ok) fetchData();
      else alert("Slot available nahi hai!");
    } catch (e) {
      alert("Server Error");
    }
  };

  // NAYA: Session ko early complete karne ka function (Customer ke pehle jaane par)
  const handleCompleteSession = async (id) => {
    if (
      !confirm("Kya customer ja chuka hai? Is session ko Complete mark karein?")
    )
      return;
    try {
      const now = new Date();
      const currentEndTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "COMPLETED",
          endTime: currentEndTime,
        }),
      });
      if (res.ok) {
        alert("Session completed successfully!");
        fetchData();
      }
    } catch (error) {
      alert("Server error.");
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Kya aap is booking ko cancel karna chahte hain?")) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "CANCELLED" }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Server error.");
    }
  };

  const openExtendModal = (booking) => {
    setExtendData({
      id: booking._id,
      startTime: booking.startTime,
      oldEndTime: booking.endTime,
      newEndTime: booking.endTime,
    });
    setIsExtendModalOpen(true);
  };

  const submitExtend = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: extendData.id,
          endTime: extendData.newEndTime,
        }),
      });
      if (res.ok) {
        alert("Booking time updated successfully!");
        fetchData();
        setIsExtendModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.message || "Error updating time.");
      }
    } catch (error) {
      alert("Server error.");
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editData.id,
          customerName: editData.name,
          customerPhone: editData.phone,
          idNumber: editData.idNumber,
        }),
      });
      if (res.ok) {
        alert("Customer details updated!");
        fetchData();
        setIsEditModalOpen(false);
      } else {
        alert("Failed to update details.");
      }
    } catch (error) {
      alert("Server error.");
    }
  };

  const handlePrintBill = (booking) => {
    const computer = computers.find((c) => c.name === booking.computerName);
    const ratePerHour = computer ? computer.hourlyRate : 50;

    const startTime = new Date(`1970-01-01T${booking.startTime}:00`);
    const endTime = new Date(`1970-01-01T${booking.endTime}:00`);
    let diffMins = Math.floor((endTime - startTime) / 60000);
    if (diffMins <= 0) diffMins += 24 * 60;

    const billedMins = Math.max(60, diffMins);
    const totalAmount = Math.ceil((ratePerHour / 60) * billedMins);

    setBillData({
      ...booking,
      ratePerHour,
      actualMins: diffMins,
      billedMins: billedMins,
      durationText: getDuration(booking.startTime, booking.endTime),
      totalAmount,
      invoiceDate: new Date().toLocaleDateString("en-IN"),
    });
    setIsBillModalOpen(true);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-100 relative print:p-0 print:border-none print:shadow-none">
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 pb-2 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">
              Booking History
            </h1>
            <p className="text-slate-500 mt-1">
              Manage, search, filter by date, and print bills.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <svg
                className="w-5 h-5 absolute left-3 top-2.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <input
                type="text"
                placeholder="Search name, phone or PC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 transition"
              />
            </div>

            <div className="relative group cursor-pointer">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="py-2 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 font-medium cursor-pointer w-full transition"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="absolute right-8 top-2.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear Date"
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
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending (Online)</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              Total Bookings
            </p>
            <p className="text-2xl font-extrabold text-blue-800 mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
              Active (Confirmed)
            </p>
            <p className="text-2xl font-extrabold text-emerald-800 mt-1">
              {stats.active}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center shadow-sm">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Completed
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">
              {stats.completed}
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center shadow-sm">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wide">
              Cancelled
            </p>
            <p className="text-2xl font-extrabold text-red-800 mt-1">
              {stats.cancelled}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium animate-pulse">
            Loading data...
          </div>
        ) : currentBookings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            Koi matching booking nahi mili.{" "}
            {dateFilter && "Try clearing the date filter."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Customer Details</th>
                    <th className="p-4 font-bold">System</th>
                    <th className="p-4 font-bold">Time Slot</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBookings.map((booking) => {
                    const status = booking.dynamicStatus;
                    return (
                      <tr
                        key={booking._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 text-slate-700 font-semibold text-sm">
                          {booking.date.split("-").reverse().join("-")}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">
                            {booking.customerName}
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {booking.customerPhone}
                          </p>
                          {booking.idNumber && (
                            <span className="inline-block bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded mt-1 uppercase tracking-wider">
                              ID: {booking.idNumber}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm border border-blue-200">
                            {booking.computerName}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-slate-800 font-bold text-sm">
                            {formatTime(booking.startTime)}{" "}
                            <span className="text-slate-400 font-normal mx-1">
                              to
                            </span>{" "}
                            {formatTime(booking.endTime)}
                          </p>
                          <p className="text-xs font-semibold text-blue-600 mt-1">
                            ⏱ {getDuration(booking.startTime, booking.endTime)}
                          </p>
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-bold px-3 py-1 rounded-full text-[10px] uppercase border ${status.color}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center flex-wrap gap-2">
                            {(status.text === "PENDING" ||
                              status.text === "CANCELLED") &&
                              booking.bookingType === "ONLINE" && (
                                <button
                                  onClick={() => handleStartSession(booking)}
                                  className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded border border-emerald-200 transition-colors text-xs font-bold shadow-sm"
                                >
                                  Start
                                </button>
                              )}

                            {/* NAYA: Agar session active (CONFIRMED) hai, toh admin 'Complete' button dabakar session pehle hi khatam kar sakta hai */}
                            {status.text === "CONFIRMED" && (
                              <button
                                onClick={() =>
                                  handleCompleteSession(booking._id)
                                }
                                className="bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white px-3 py-1.5 rounded border border-teal-200 transition-colors text-xs font-bold shadow-sm"
                              >
                                Complete
                              </button>
                            )}

                            {(status.text === "CONFIRMED" ||
                              status.text === "COMPLETED") && (
                              <button
                                onClick={() => handlePrintBill(booking)}
                                className="bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded border border-purple-200 transition-colors text-xs font-bold shadow-sm"
                              >
                                Print Bill
                              </button>
                            )}

                            {status.text !== "CANCELLED" &&
                              status.text !== "PENDING" &&
                              status.text !== "COMPLETED" && (
                                <button
                                  onClick={() => openExtendModal(booking)}
                                  className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded border border-blue-200 transition-colors text-xs font-bold shadow-sm"
                                >
                                  Time Adjust
                                </button>
                              )}

                            <button
                              onClick={() => {
                                setEditData({
                                  id: booking._id,
                                  name: booking.customerName,
                                  phone: booking.customerPhone,
                                  idNumber: booking.idNumber || "",
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded border border-amber-200 transition-colors text-xs font-bold shadow-sm"
                            >
                              Edit
                            </button>

                            {status.text !== "CANCELLED" &&
                              status.text !== "COMPLETED" && (
                                <button
                                  onClick={() => handleCancel(booking._id)}
                                  className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded border border-red-200 transition-colors text-xs font-bold shadow-sm"
                                >
                                  Cancel
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <span className="text-sm font-medium text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredBookings.length,
                  )}{" "}
                  of {filteredBookings.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-4 font-bold text-slate-700 bg-slate-100 rounded-lg">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DETAILED BILL / INVOICE MODAL */}
      {isBillModalOpen && billData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden print:shadow-none print:w-full print:border-none">
            <div id="invoice-receipt" className="p-8 text-slate-800 bg-white">
              <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-6">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  CYBER CAFE
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Official Tax Invoice / Bill
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Invoice Date: {billData.invoiceDate}
                </p>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">
                    Customer Name:
                  </span>
                  <span className="font-bold">{billData.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">
                    Phone Number:
                  </span>
                  <span className="font-bold">{billData.customerPhone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">
                    Assigned PC:
                  </span>
                  <span className="font-bold">{billData.computerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">
                    Booking Date:
                  </span>
                  <span className="font-bold">
                    {billData.date.split("-").reverse().join("-")}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">
                    Time Slot:
                  </span>
                  <span className="font-bold">
                    {formatTime(billData.startTime)} -{" "}
                    {formatTime(billData.endTime)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">
                    Usage Duration:
                  </span>
                  <span className="font-bold">{billData.durationText}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">
                    Hourly Rate:
                  </span>
                  <span className="font-bold">
                    ₹{billData.ratePerHour} / hr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">
                    Billing Policy:
                  </span>
                  <span className="font-bold text-blue-600">
                    Min. 1 Hour Applied
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-slate-300 pt-5 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    *Includes all taxes & minimum charge
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    Grand Total
                  </span>
                </div>
                <span className="text-3xl font-extrabold text-emerald-600">
                  ₹{billData.totalAmount}
                </span>
              </div>
              <p className="text-center text-xs text-slate-400 mt-8 italic">
                Thank you for visiting Cyber Cafe!
              </p>
            </div>

            <div className="p-4 bg-slate-50 flex gap-3 print:hidden border-t border-slate-100">
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md transition flex items-center justify-center gap-2"
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  ></path>
                </svg>
                Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <div className="print:hidden">
        {isExtendModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
              <div className="bg-blue-600 p-4 text-white text-center">
                <h2 className="text-xl font-bold">Adjust Booking Time</h2>
              </div>
              <form onSubmit={submitExtend} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    New End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={extendData.newEndTime}
                    onChange={(e) =>
                      setExtendData({
                        ...extendData,
                        newEndTime: e.target.value,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsExtendModalOpen(false)}
                    className="w-1/2 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                  >
                    Update Time
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
              <div className="bg-amber-500 p-4 text-white text-center">
                <h2 className="text-xl font-bold">Edit Details</h2>
              </div>
              <form onSubmit={submitEdit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={editData.idNumber}
                    onChange={(e) =>
                      setEditData({ ...editData, idNumber: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-1/2 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-lg font-bold text-white bg-amber-500 hover:bg-amber-600 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
