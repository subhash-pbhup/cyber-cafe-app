"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        cafeName: "",
        phone: "",
        address: "",
        defaultRate: 50,
        graceMinutes: 10,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings", {
                headers: { "ngrok-skip-browser-warning": "true" },
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    cafeName: data.cafeName || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    defaultRate: data.defaultRate || 50,
                    graceMinutes: data.graceMinutes || 10,
                });
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true",
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert("Settings updated successfully!");
            } else {
                alert("Failed to update settings.");
            }
        } catch (error) {
            alert("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-slate-500 font-bold animate-pulse">LOADING SETTINGS...</div>
            </div>
        );
    }

    return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-100 relative print:p-0 print:border-none print:shadow-none">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">Cafe Settings</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Apne cafe ki general information aur booking rules yahan se manage karein.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Cafe Name
                        </label>
                        <input
                            type="text"
                            name="cafeName"
                            value={formData.cafeName}
                            onChange={handleChange}
                            required
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Contact Phone
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="e.g., +91 9876543210"
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Cafe Address
                    </label>
                    <textarea
                        name="address"
                        rows="3"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter full address of your cyber cafe..."
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Default Hourly Rate (₹)
                        </label>
                        <input
                            type="number"
                            name="defaultRate"
                            value={formData.defaultRate}
                            onChange={handleChange}
                            required
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Online Booking Grace Period (Minutes)
                        </label>
                        <input
                            type="number"
                            name="graceMinutes"
                            value={formData.graceMinutes}
                            onChange={handleChange}
                            required
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium transition"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                            Kitne minutes late hone par pending online booking auto-cancel ho jayegi.
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/20 transition-all duration-300 disabled:opacity-50"
                    >
                        {saving ? "Saving Changes..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
}