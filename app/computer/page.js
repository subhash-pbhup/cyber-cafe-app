"use client";
import { useState, useEffect } from "react";

export default function ManageComputersPage() {
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Form States
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    name: "",
    hourlyRate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchComputers();
  }, []);

  const fetchComputers = async () => {
    try {
      const res = await fetch("/api/computers");
      const data = await res.json();
      setComputers(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching computers:", error);
      setLoading(false);
    }
  };

  // Create PC
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName || !newRate) return;

    try {
      const res = await fetch("/api/computers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, hourlyRate: Number(newRate) }),
      });

      if (res.ok) {
        setNewName("");
        setNewRate("");
        fetchComputers();
      } else {
        alert("PC add karne me error aayi.");
      }
    } catch (error) {
      alert("Server error.");
    }
  };

  // Delete PC
  const handleDelete = async (id) => {
    if (
      !confirm(
        "Kya aap sach me is PC ko delete karna chahte hain? Iska data wapas nahi aayega.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/computers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchComputers();
      } else {
        alert("Delete karne me fail hua.");
      }
    } catch (error) {
      alert("Server error.");
    }
  };

  // Update PC
  const openEditModal = (pc) => {
    setEditData({
      id: pc._id,
      name: pc.name,
      hourlyRate: pc.hourlyRate,
      isActive: pc.isActive !== false,
    });
    setIsEditModalOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/computers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchComputers();
      } else {
        alert("Update fail ho gaya.");
      }
    } catch (error) {
      alert("Server error.");
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-100">
      <div className="mb-8 border-b border-slate-100 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800">
          Manage Computers
        </h1>
        <p className="text-slate-500 mt-1">
          Add, edit, or remove systems from your cyber cafe.
        </p>
      </div>

      {/* Add New PC Section */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm mb-10">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Add New PC</h2>
        <form
          onSubmit={handleAdd}
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-bold text-slate-600 mb-1">
              PC Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., PC-10"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-bold text-slate-600 mb-1">
              Rate/Hr (₹)
            </label>
            <input
              type="number"
              required
              placeholder="50"
              min="1"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm h-11"
          >
            Add PC
          </button>
        </form>
      </div>

      {/* PC List Table */}
      <h2 className="text-lg font-bold text-slate-700 mb-4">
        Total Systems: {computers.length}
      </h2>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium animate-pulse">
          Loading systems...
        </div>
      ) : computers.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          Koi PC available nahi hai. Upar se naya PC add karein.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-bold">System Name</th>
                <th className="p-4 font-bold">Hourly Rate</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {computers.map((pc) => (
                <tr
                  key={pc._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4 font-bold text-slate-800 text-lg flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-slate-400"
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
                    {pc.name}
                  </td>
                  <td className="p-4 font-semibold text-slate-600">
                    ₹{pc.hourlyRate} / hr
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border ${
                        pc.isActive !== false
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-rose-100 text-rose-700 border-rose-200"
                      }`}
                    >
                      {pc.isActive !== false ? "Active" : "Maintenance"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(pc)}
                        className="bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded border border-amber-200 transition-colors text-xs font-bold shadow-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pc._id)}
                        className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded border border-red-200 transition-colors text-xs font-bold shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="bg-amber-500 p-4 text-white text-center">
              <h2 className="text-xl font-bold">Edit System</h2>
            </div>
            <form onSubmit={submitEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  PC Name
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
                  Rate/Hr (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editData.hourlyRate}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      hourlyRate: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editData.isActive}
                  onChange={(e) =>
                    setEditData({ ...editData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-500 focus:ring-amber-500 rounded border-slate-300"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-bold text-slate-700 cursor-pointer"
                >
                  System is Active (Ready for booking)
                </label>
              </div>
              <div className="flex gap-3 pt-3 mt-2">
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
  );
}
