import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Button from "../components/ui/button";
import TicketCard from "../components/TicketCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Building2, Sparkles, Droplets, UserPlus, Trash2, ChevronDown, ChevronUp, ClipboardList, Users, Star, Megaphone, Settings, LogOut } from "lucide-react";

const FLOORS = ["1", "2", "3", "4", "5"];
const API = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const JANITOR_ROLE_LABELS = {
  roomCleaner: "Room Cleaner",
  corridorCleaner: "Corridor Cleaner",
  washroomCleaner: "Washroom Cleaner",
};

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-[#4A7C59]" : "text-[#B8D9C4]"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function DashboardCaretaker() {
  const [tickets, setTickets] = useState({ open: [], inProcess: [], resolved_pending: [], resolved: [] });
  const [activeTab, setActiveTab] = useState("open");
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  // Staff management
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);

  // Staff duties
  const [selectedFloor, setSelectedFloor] = useState("1");
  const [janitors, setJanitors] = useState({ roomCleaner: "", corridorCleaner: "", washroomCleaner: "" });
  const [janitorsLoading, setJanitorsLoading] = useState(false);
  const [savingDuties, setSavingDuties] = useState(false);

  // Ratings
  const [staffRatings, setStaffRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingSortOrder, setRatingSortOrder] = useState("desc");
  const [expandedStaff, setExpandedStaff] = useState({});

  // Announcements
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "medium" });

  useEffect(() => { setSlideIndex(0); }, [activeTab]);

  // ── Fetch tickets ────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${API}/api/caretaker/tickets`, { headers: authHeader() });
        const all = res.data.tickets || [];
        setTickets({
          open: all.filter(t => t.status === "open").sort((a, b) => b.aiConfidence - a.aiConfidence),
          inProcess: all.filter(t => t.status === "in-progress"),
          resolved_pending: all.filter(t => t.status === "resolved_pending"),
          resolved: all.filter(t => t.status === "resolved"),
        });
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // ── Fetch staff list ─────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await axios.get(`${API}/api/caretaker/staff`, { headers: authHeader() });
      setStaffList(res.data.staff || []);
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "manageStaff" || activeTab === "staffDuties") fetchStaff();
  }, [activeTab, fetchStaff]);

  // ── Fetch floor janitor assignments ──────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "staffDuties") return;
    const fetchJanitors = async () => {
      setJanitorsLoading(true);
      try {
        const res = await axios.get(`${API}/api/caretaker/janitors/${selectedFloor}`, { headers: authHeader() });
        const j = res.data || {};
        setJanitors({
          roomCleaner: j.roomCleaner?._id || j.roomCleaner || "",
          corridorCleaner: j.corridorCleaner?._id || j.corridorCleaner || "",
          washroomCleaner: j.washroomCleaner?._id || j.washroomCleaner || "",
        });
      } catch (err) {
        if (err.response?.status === 404) {
          setJanitors({ roomCleaner: "", corridorCleaner: "", washroomCleaner: "" });
        } else {
          console.error("Error fetching janitors", err);
        }
      } finally {
        setJanitorsLoading(false);
      }
    };
    fetchJanitors();
  }, [selectedFloor, activeTab]);

  // ── Fetch staff ratings ──────────────────────────────────────────────────────
  const fetchStaffRatings = useCallback(async () => {
    setRatingsLoading(true);
    try {
      const res = await axios.get(
        `${API}/api/caretaker/staff-ratings?sortOrder=${ratingSortOrder}`,
        { headers: authHeader() }
      );
      setStaffRatings(res.data.ratings || []);
    } catch (err) {
      console.error("Error fetching staff ratings:", err);
    } finally {
      setRatingsLoading(false);
    }
  }, [ratingSortOrder]);

  useEffect(() => {
    if (activeTab === "ratings") fetchStaffRatings();
  }, [activeTab, fetchStaffRatings]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`${API}/api/caretaker/tickets/${id}/status`, { status: newStatus }, { headers: authHeader() });
      const updated = res.data.ticket;
      setTickets(prev => {
        const open = prev.open.filter(t => t._id !== id);
        const inProcess = prev.inProcess.filter(t => t._id !== id);
        const resolved = prev.resolved.filter(t => t._id !== id);
        const resolved_pending = prev.resolved_pending.filter(t => t._id !== id);
        if (newStatus === "in-progress") inProcess.push(updated);
        if (newStatus === "resolved_pending") resolved_pending.push(updated);
        if (newStatus === "resolved") resolved.push(updated);
        return { open: open.sort((a, b) => b.aiConfidence - a.aiConfidence), inProcess, resolved_pending, resolved };
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update ticket");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    setAddingStaff(true);
    try {
      await axios.post(`${API}/api/caretaker/staff`, { name: newStaffName.trim(), phone: newStaffPhone.trim() }, { headers: authHeader() });
      setNewStaffName("");
      setNewStaffPhone("");
      await fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add staff member");
    } finally {
      setAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (!window.confirm(`Remove "${name}" from staff? Their past ratings will be preserved.`)) return;
    try {
      await axios.delete(`${API}/api/caretaker/staff/${staffId}`, { headers: authHeader() });
      await fetchStaff();
    } catch (err) {
      alert("Failed to remove staff member");
    }
  };

  const handleUpdateJanitors = async () => {
    setSavingDuties(true);
    try {
      await axios.put(`${API}/api/caretaker/update-janitors/${selectedFloor}`, janitors, { headers: authHeader() });
      alert("Staff assignments saved for this floor.");
    } catch (err) {
      alert("Failed to save staff assignments.");
    } finally {
      setSavingDuties(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/caretaker/announcements`, announcementForm, { headers: authHeader() });
      alert("Announcement posted successfully!");
      setShowAnnouncementDialog(false);
      setAnnouncementForm({ title: "", content: "", priority: "medium" });
    } catch (err) {
      alert("Failed to post announcement");
    }
  };

  const toggleExpand = (staffId) =>
    setExpandedStaff(prev => ({ ...prev, [staffId]: !prev[staffId] }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4F7F4" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F2EC] flex items-center justify-center animate-pulse">
            <ClipboardList className="w-5 h-5 text-[#4A7C59]" />
          </div>
          <p className="text-[#7A9282] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const isTicketView = !["ratings", "staffDuties", "manageStaff"].includes(activeTab);

  const NAV_ITEMS = [
    { id: "open",            label: "Open Tickets",   Icon: ClipboardList },
    { id: "inProcess",       label: "In-Process",     Icon: ClipboardList },
    { id: "resolved_pending",label: "Resolved (Pending)", Icon: ClipboardList },
    { id: "resolved",        label: "Resolved",       Icon: ClipboardList },
    { id: "manageStaff",     label: "Manage Staff",   Icon: Users },
    { id: "staffDuties",     label: "Staff Duties",   Icon: Sparkles },
    { id: "ratings",         label: "Staff Ratings",  Icon: Star },
  ];

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif", background: "#F4F7F4" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-white border-r border-[#D6E8DC] flex flex-col sticky top-0 h-screen z-40">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#D6E8DC]">
          <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] flex items-center justify-center mb-3">
            <svg className="w-5 h-5" fill="none" stroke="#4A7C59" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[#1A2E1F]">CleanTrack</p>
          <p className="text-[11px] text-[#7A9282] mt-0.5">Caretaker Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest px-2 mb-2">Tickets</p>
          {NAV_ITEMS.slice(0, 4).map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 border border-transparent mb-0.5
                ${activeTab === id ? "bg-[#E8F2EC] text-[#2D5A3D] font-semibold" : "text-[#7A9282] hover:bg-[#E8F2EC] hover:text-[#2D5A3D]"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {id === "open" && tickets.open.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-[#4A7C59] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {tickets.open.length}
                </span>
              )}
            </button>
          ))}

          <p className="text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest px-2 mb-2 mt-4">Staff</p>
          {NAV_ITEMS.slice(4).map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 border border-transparent mb-0.5
                ${activeTab === id ? "bg-[#E8F2EC] text-[#2D5A3D] font-semibold" : "text-[#7A9282] hover:bg-[#E8F2EC] hover:text-[#2D5A3D]"}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}

          <p className="text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest px-2 mb-2 mt-4">Actions</p>
          <button onClick={() => setShowAnnouncementDialog(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#7A9282] hover:bg-[#E8F2EC] hover:text-[#2D5A3D] transition-all border border-transparent mb-0.5">
            <Megaphone className="w-4 h-4 shrink-0" />
            Announcements
          </button>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#D6E8DC]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#4A7C59] flex items-center justify-center text-white text-[11px] font-bold shrink-0">CT</div>
            <div>
              <p className="text-[12px] font-semibold text-[#1A2E1F]">Caretaker</p>
              <p className="text-[11px] text-[#7A9282]">Floor Admin</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-medium text-[#7A9282] hover:bg-red-50 hover:text-red-600 transition-all border border-transparent">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="bg-white border-b border-[#D6E8DC] px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl text-[#1A2E1F]" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>
              Hello, Caretaker
            </h1>
            <p className="text-[12px] text-[#7A9282] mt-0.5">Manage sanitation tickets for your assigned areas</p>
          </div>
          <button onClick={() => setShowAnnouncementDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A7C59] hover:bg-[#2D5A3D] text-white text-[13px] font-medium rounded-xl transition-all">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post Announcement
          </button>
        </header>

        <main className="flex-1 px-8 py-7">

          {/* ── MANAGE STAFF ─────────────────────────────────────────────── */}
          {activeTab === "manageStaff" && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-[#D6E8DC] overflow-hidden shadow-sm">
                <div className="h-1 bg-gradient-to-r from-[#4A7C59] to-[#7DB88A]" />
                <div className="p-7">
                  <h2 className="text-lg font-semibold text-[#1A2E1F] mb-1">Add / Remove Staff</h2>
                  <p className="text-[13px] text-[#7A9282] mb-6">Staff added here appear in the Staff Duties dropdowns.</p>

                  <form onSubmit={handleAddStaff} className="flex flex-col sm:flex-row gap-3 mb-8">
                    <input type="text" value={newStaffName} required
                      onChange={e => setNewStaffName(e.target.value)} placeholder="Full name *"
                      className="flex-1 rounded-xl border border-[#D6E8DC] px-3 py-2.5 text-sm focus:border-[#4A7C59] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 bg-[#F4F7F4]" />
                    <input type="text" value={newStaffPhone}
                      onChange={e => setNewStaffPhone(e.target.value)} placeholder="Phone (optional)"
                      className="sm:max-w-[160px] rounded-xl border border-[#D6E8DC] px-3 py-2.5 text-sm focus:border-[#4A7C59] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 bg-[#F4F7F4]" />
                    <button type="submit" disabled={addingStaff}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#4A7C59] hover:bg-[#2D5A3D] text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-60 transition-all">
                      <UserPlus className="w-4 h-4" />
                      {addingStaff ? "Adding…" : "Add Staff"}
                    </button>
                  </form>

                  {staffLoading ? (
                    <p className="text-center py-8 text-[#7A9282] text-sm">Loading…</p>
                  ) : staffList.length === 0 ? (
                    <p className="text-center py-8 text-[#7A9282] text-sm">No staff members yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {staffList.map(s => (
                        <div key={s._id}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all
                            ${s.isActive ? "border-[#D6E8DC] bg-[#F4F7F4]" : "border-red-100 bg-red-50/40 opacity-60"}`}>
                          <div>
                            <p className={`text-sm font-semibold ${s.isActive ? "text-[#1A2E1F]" : "text-gray-400 line-through"}`}>
                              {s.name}
                              {!s.isActive && <span className="ml-2 text-xs font-normal text-red-400">(removed)</span>}
                            </p>
                            {s.phone && <p className="text-xs text-[#7A9282] mt-0.5">{s.phone}</p>}
                          </div>
                          {s.isActive && (
                            <button onClick={() => handleDeleteStaff(s._id, s.name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-all">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STAFF DUTIES ─────────────────────────────────────────────── */}
          {activeTab === "staffDuties" && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-2xl border border-[#D6E8DC] overflow-hidden shadow-sm">
                <div className="h-1 bg-gradient-to-r from-[#4A7C59] via-cyan-400 to-indigo-400" />
                <div className="p-7">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1A2E1F]">Assign Staff Duties</h2>
                      <p className="text-[13px] text-[#7A9282] mt-1">Select a registered staff member for each role on a floor.</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#E8F2EC] px-3 py-1 text-xs font-semibold text-[#2D5A3D] border border-[#B8D9C4]">
                      Floor {selectedFloor}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest mb-2">Select floor</p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {FLOORS.map(f => (
                      <button key={f} onClick={() => setSelectedFloor(f)}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all border
                          ${selectedFloor === f
                            ? "bg-[#4A7C59] text-white border-[#4A7C59] shadow-md"
                            : "bg-[#F4F7F4] text-[#7A9282] border-[#D6E8DC] hover:bg-[#E8F2EC] hover:text-[#2D5A3D]"}`}>
                        {f}
                      </button>
                    ))}
                  </div>

                  {janitorsLoading ? (
                    <p className="text-center py-12 text-[#7A9282] text-sm">Loading staff for this floor…</p>
                  ) : staffList.filter(s => s.isActive).length === 0 ? (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                      No staff members yet. Please add staff first using <strong>Manage Staff</strong>.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { key: "roomCleaner",     title: "Room Cleaner",     hint: "Cleans individual rooms",     Icon: Sparkles  },
                        { key: "corridorCleaner", title: "Corridor Cleaner", hint: "Common corridors & passages", Icon: Building2 },
                        { key: "washroomCleaner", title: "Washroom Cleaner", hint: "Washrooms & toilets",         Icon: Droplets  },
                      ].map(({ key, title, hint, Icon }) => (
                        <div key={key} className="rounded-xl border border-[#D6E8DC] bg-[#F4F7F4] p-4 hover:border-[#4A7C59]/40 transition-all">
                          <div className="flex gap-4">
                            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#E8F2EC] flex items-center justify-center">
                              <Icon className="w-5 h-5 text-[#4A7C59]" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <label className="block text-sm font-semibold text-[#1A2E1F]" htmlFor={`duty-${key}`}>{title}</label>
                              <p className="text-xs text-[#7A9282] mt-0.5 mb-2">{hint}</p>
                              <select id={`duty-${key}`} value={janitors[key]}
                                onChange={e => setJanitors(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full rounded-xl border border-[#D6E8DC] bg-white px-3 py-2 text-sm text-[#1A2E1F] focus:border-[#4A7C59] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20">
                                <option value="">— Unassigned —</option>
                                {staffList.filter(s => s.isActive).map(s => (
                                  <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row gap-3 pt-3">
                        <button onClick={handleUpdateJanitors} disabled={savingDuties}
                          className="sm:flex-1 py-2.5 bg-[#4A7C59] hover:bg-[#2D5A3D] text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-60 transition-all">
                          {savingDuties ? "Saving…" : "Save assignments"}
                        </button>
                        <p className="text-xs text-[#7A9282] sm:flex-1 sm:self-center">
                          Changes apply to every room on floor {selectedFloor}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── RATINGS ──────────────────────────────────────────────────── */}
          {activeTab === "ratings" && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-2xl border border-[#D6E8DC] shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#4A7C59] to-purple-400" />
                <div className="p-7">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-[#1A2E1F]">Staff Performance</h2>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#7A9282]">Sort:</label>
                      <select value={ratingSortOrder} onChange={e => setRatingSortOrder(e.target.value)}
                        className="px-3 py-1.5 border border-[#D6E8DC] rounded-xl text-xs text-[#1A2E1F] focus:ring-2 focus:ring-[#4A7C59]/30 focus:outline-none bg-[#F4F7F4]">
                        <option value="desc">Highest First</option>
                        <option value="asc">Lowest First</option>
                      </select>
                    </div>
                  </div>

                  {ratingsLoading ? (
                    <p className="text-center py-10 text-[#7A9282]">Loading ratings…</p>
                  ) : staffRatings.length === 0 ? (
                    <p className="text-center py-10 text-[#7A9282]">No ratings submitted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {staffRatings.map(r => (
                        <div key={r.staffId} className="rounded-xl border border-[#D6E8DC] bg-[#F4F7F4] overflow-hidden">
                          <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#4A7C59] flex items-center justify-center text-white font-bold text-sm shadow">
                                {r.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-[#1A2E1F] text-sm">{r.name}</p>
                                <p className="text-xs text-[#7A9282]">{r.totalRatings} rating{r.totalRatings !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-[#4A7C59]">{r.avgRating.toFixed(1)}</p>
                                <StarRow rating={r.avgRating} />
                              </div>
                              <button onClick={() => toggleExpand(r.staffId)}
                                className="p-1.5 rounded-lg hover:bg-[#E8F2EC] text-[#7A9282] transition-all">
                                {expandedStaff[r.staffId] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          {expandedStaff[r.staffId] && (
                            <div className="border-t border-[#D6E8DC] bg-white px-5 py-3">
                              <p className="text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest mb-2">Duties</p>
                              <div className="flex flex-wrap gap-2">
                                {r.duties.map((d, i) => (
                                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F2EC] text-[#2D5A3D] border border-[#B8D9C4] text-xs font-medium">
                                    <span className="font-semibold">Floor {d.floor}</span>
                                    <span className="text-[#7A9282]">·</span>
                                    {JANITOR_ROLE_LABELS[d.janitorType] || d.janitorType}
                                  </span>
                                ))}
                                {r.duties.length === 0 && <span className="text-xs text-[#7A9282]">No duty breakdown available</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TICKETS VIEW ─────────────────────────────────────────────── */}
          {isTicketView && (
            <div className="max-w-6xl">
              <div className="relative overflow-hidden">
                <button onClick={() => setSlideIndex(prev => Math.max(prev - 1, 0))}
                  className="absolute left-0 top-[45%] -translate-y-1/2 z-20 w-9 h-9 bg-white border border-[#D6E8DC] rounded-full flex items-center justify-center shadow hover:bg-[#E8F2EC] transition text-sm">
                  ◀
                </button>
                <button onClick={() => setSlideIndex(prev => prev + 1)}
                  className="absolute right-0 top-[45%] -translate-y-1/2 z-20 w-9 h-9 bg-white border border-[#D6E8DC] rounded-full flex items-center justify-center shadow hover:bg-[#E8F2EC] transition text-sm">
                  ▶
                </button>

                <div className="flex transition-transform duration-500 ease-in-out mx-10"
                  style={{ transform: `translateX(-${slideIndex * 50}%)` }}>
                  {(tickets[activeTab] || []).length === 0 ? (
                    <div className="w-full text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-[#E8F2EC] flex items-center justify-center mx-auto mb-3">
                        <ClipboardList className="w-7 h-7 text-[#4A7C59]" />
                      </div>
                      <p className="text-[#7A9282] text-sm">No tickets found.</p>
                    </div>
                  ) : (
                    (tickets[activeTab] || []).map(t => (
                      <div key={t._id} className="w-1/2 px-3 shrink-0">
                        <div className="bg-white rounded-2xl border border-[#D6E8DC] shadow-sm overflow-hidden">
                          <div className="h-1 bg-gradient-to-r from-[#4A7C59] to-[#7DB88A]" />
                          <div className="p-5">
                            <TicketCard
                              ticket={{
                                id: t._id,
                                title: t.title,
                                roomNumber: t.roomNumber,
                                floorSelected: t.floorSelected,
                                locationSelected: t.locationSelected,
                                photoUrl: t.photoUrl,
                                floor: t.floorSelected || t.floor || "-",
                                submittedAt: new Date(t.createdAt).toLocaleString(),
                                status: t.status === "open" ? "pending" : t.status,
                                description: t.description,
                                aiConfidence: t.aiConfidence,
                                submittedBy: t.studentEmail,
                              }}
                            />
                            {t.status === "open" && (
                              <button onClick={() => updateStatus(t._id, "in-progress")}
                                className="mt-4 w-full py-2.5 bg-[#4A7C59] hover:bg-[#2D5A3D] text-white text-sm font-semibold rounded-xl transition-all">
                                Mark as In-Progress
                              </button>
                            )}
                            {t.status === "in-progress" && (
                              <button onClick={() => updateStatus(t._id, "resolved_pending")}
                                className="mt-4 w-full py-2.5 bg-[#4A7C59] hover:bg-[#2D5A3D] text-white text-sm font-semibold rounded-xl transition-all">
                                Mark as Resolved (Pending)
                              </button>
                            )}
                            {t.status === "resolved_pending" && (
                              <button disabled
                                className="mt-4 w-full py-2.5 bg-[#E8F2EC] text-[#7A9282] text-sm font-semibold rounded-xl cursor-not-allowed">
                                Waiting for student confirmation
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── ANNOUNCEMENT DIALOG ──────────────────────────────────────────── */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="w-[600px] max-w-full mx-auto bg-white rounded-2xl shadow-xl p-7 border border-[#D6E8DC]">
          <button aria-label="Close" onClick={() => setShowAnnouncementDialog(false)}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-[#E8F2EC] transition">
            <svg className="w-4 h-4 text-[#7A9282]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#1A2E1F] text-center">Post New Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostAnnouncement} className="mt-5 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest mb-1.5">Title *</label>
              <input type="text" required value={announcementForm.title}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter announcement title"
                className="w-full px-3 py-2.5 border border-[#D6E8DC] rounded-xl text-sm focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] focus:outline-none bg-[#F4F7F4]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest mb-1.5">Content *</label>
              <textarea required rows={5} value={announcementForm.content}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter announcement content"
                className="w-full px-3 py-2.5 border border-[#D6E8DC] rounded-xl text-sm focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] focus:outline-none resize-none bg-[#F4F7F4]" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#7A9282] uppercase tracking-widest mb-1.5">Priority</label>
              <select value={announcementForm.priority}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[#D6E8DC] rounded-xl text-sm focus:ring-2 focus:ring-[#4A7C59]/30 focus:outline-none bg-[#F4F7F4]">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAnnouncementDialog(false)}
                className="flex-1 py-2.5 bg-[#F4F7F4] text-[#7A9282] hover:bg-[#E8F2EC] border border-[#D6E8DC] rounded-xl text-sm font-semibold transition-all">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 bg-[#4A7C59] hover:bg-[#2D5A3D] text-white rounded-xl text-sm font-semibold transition-all">
                Post Announcement
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}