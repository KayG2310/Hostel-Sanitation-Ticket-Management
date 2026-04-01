import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Button from "../components/ui/button";
import TicketCard from "../components/TicketCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Building2, Sparkles, Droplets, UserPlus, Trash2, Star, ChevronDown, ChevronUp } from "lucide-react";

const FLOORS = ["1", "2", "3", "4", "5"];
const API = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const JANITOR_ROLE_LABELS = {
  roomCleaner: "Room Cleaner",
  corridorCleaner: "Corridor Cleaner",
  washroomCleaner: "Washroom Cleaner",
};

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

  // ── Fetch tickets ───────────────────────────────────────────────────────────
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

  // ── Fetch staff list (needed by duties dropdowns + manage tab) ──────────────
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

  // ── Fetch floor janitor assignments ─────────────────────────────────────────
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

  // ── Fetch staff ratings ─────────────────────────────────────────────────────
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

  // ── Actions ─────────────────────────────────────────────────────────────────
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

  const renderStars = (avg) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={`w-4 h-4 ${star <= Math.round(avg) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>
    );
  }

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const TABS = [
    { id: "open", label: "Open Tickets", activeClass: "bg-blue-50 text-blue-700 border-blue-200" },
    { id: "inProcess", label: "In-Process", activeClass: "bg-amber-50 text-amber-700 border-amber-200" },
    { id: "resolved_pending", label: "Resolved Pending", activeClass: "bg-sky-50 text-sky-700 border-sky-200" },
    { id: "resolved", label: "Resolved", activeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { id: "manageStaff", label: "Manage Staff", activeClass: "bg-orange-50 text-orange-700 border-orange-200" },
    { id: "staffDuties", label: "Assign Staff Duties", activeClass: "bg-teal-50 text-teal-800 border-teal-200" },
    { id: "ratings", label: "Staff Ratings", activeClass: "bg-purple-50 text-purple-700 border-purple-200" },
  ];

  return (
    <div className="w-full min-h-screen">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white border-b border-gray-100 shadow-sm z-40 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="relative w-full py-6 px-6 sm:px-10 lg:px-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Caretaker Dashboard</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Manage sanitation tickets for your assigned areas</p>
            </div>
          </div>

          <button
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            className="group relative px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline relative z-10">Logout</span>
          </button>
        </div>

        {/* Tab row */}
        <div className="relative w-full px-6 sm:px-10 lg:px-14 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 pt-3 pb-3">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${activeTab === tab.id ? `${tab.activeClass} shadow-sm` : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                  }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setShowAnnouncementDialog(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm border border-indigo-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post Announcement
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="flex justify-center min-h-[calc(100vh-96px)] mt-6 px-4 sm:px-6 pb-10">

        {/* ── MANAGE STAFF TAB ─────────────────────────────────────────────── */}
        {activeTab === "manageStaff" && (
          <div className="w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg shadow-orange-500/5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400" />
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Add / Delete Staff</h2>
                <p className="text-sm text-gray-500 mb-6">Staff members registered here appear in the Staff Duties dropdowns.</p>

                {/* Add staff form */}
                <form onSubmit={handleAddStaff} className="flex flex-col sm:flex-row gap-3 mb-8">
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    placeholder="Full name *"
                    required
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <input
                    type="text"
                    value={newStaffPhone}
                    onChange={e => setNewStaffPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="flex-1 sm:max-w-[160px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="submit"
                    disabled={addingStaff}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-60 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    {addingStaff ? "Adding…" : "Add Staff"}
                  </button>
                </form>

                {/* Staff list */}
                {staffLoading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">Loading…</div>
                ) : staffList.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No staff members yet. Add one above.</div>
                ) : (
                  <div className="space-y-2">
                    {staffList.map(s => (
                      <div
                        key={s._id}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${s.isActive
                          ? "border-gray-100 bg-gray-50/80"
                          : "border-red-100 bg-red-50/40 opacity-60"
                          }`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${s.isActive ? "text-gray-900" : "text-gray-500 line-through"}`}>
                            {s.name}
                            {!s.isActive && <span className="ml-2 text-xs font-normal text-red-400">(removed)</span>}
                          </p>
                          {s.phone && <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>}
                        </div>
                        {s.isActive && (
                          <button
                            onClick={() => handleDeleteStaff(s._id, s.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
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

        {/* ── STAFF DUTIES TAB ─────────────────────────────────────────────── */}
        {activeTab === "staffDuties" && (
          <div className="w-full max-w-3xl">
            <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-lg shadow-teal-500/5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-500 to-indigo-500" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Assign Staff Duties</h2>
                    <p className="mt-1 text-sm text-gray-500">Select a registered staff member for each role on a floor.</p>
                  </div>
                  <span className="inline-flex items-center self-start rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800 border border-teal-100">
                    Floor {selectedFloor}
                  </span>
                </div>

                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Select floor</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {FLOORS.map(f => (
                    <button
                      key={f}
                      onClick={() => setSelectedFloor(f)}
                      className={`min-w-[3rem] px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedFloor === f
                        ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/25"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {janitorsLoading ? (
                  <div className="text-center py-12 text-gray-500 text-sm">Loading staff for this floor…</div>
                ) : staffList.filter(s => s.isActive).length === 0 ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                    No staff members registered yet. Please add staff first using the <strong>Add / Delete Staff</strong> tab.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { key: "roomCleaner", title: "Room Cleaner", hint: "Cleans individual rooms", Icon: Sparkles, accent: "from-emerald-500 to-teal-600" },
                      { key: "corridorCleaner", title: "Corridor Cleaner", hint: "Common corridors & passages", Icon: Building2, accent: "from-cyan-500 to-blue-600" },
                      { key: "washroomCleaner", title: "Washroom Cleaner", hint: "Washrooms & toilets", Icon: Droplets, accent: "from-indigo-500 to-violet-600" },
                    ].map(({ key, title, hint, Icon, accent }) => (
                      <div key={key} className="group rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50/80 to-white p-4 sm:p-5 shadow-sm hover:border-teal-200 hover:shadow-md transition-all">
                        <div className="flex gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
                            <Icon className="h-6 w-6" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-gray-900" htmlFor={`duty-${key}`}>{title}</label>
                            <p className="text-xs text-gray-500 mt-0.5 mb-2">{hint}</p>
                            <select
                              id={`duty-${key}`}
                              value={janitors[key]}
                              onChange={e => setJanitors(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                              <option value="">— Unassigned —</option>
                              {staffList.filter(s => s.isActive).map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        type="button"
                        onClick={handleUpdateJanitors}
                        disabled={savingDuties}
                        className="sm:flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white border-0 shadow-md disabled:opacity-60"
                      >
                        {savingDuties ? "Saving…" : "Save assignments"}
                      </Button>
                      <p className="text-xs text-gray-500 sm:flex-1 sm:self-center">
                        Changes apply to every room on floor {selectedFloor}. Old ratings are not affected.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STAFF RATINGS TAB ────────────────────────────────────────────── */}
        {activeTab === "ratings" && (
          <div className="w-full max-w-3xl">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Staff Performance</h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Sort:</label>
                  <select
                    value={ratingSortOrder}
                    onChange={e => setRatingSortOrder(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="desc">Highest First</option>
                    <option value="asc">Lowest First</option>
                  </select>
                </div>
              </div>

              {ratingsLoading ? (
                <div className="text-center py-10 text-gray-500">Loading ratings…</div>
              ) : staffRatings.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No ratings submitted yet.</div>
              ) : (
                <div className="space-y-4">
                  {staffRatings.map((r) => (
                    <div key={r.staffId} className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50/60 to-white shadow-sm overflow-hidden">
                      {/* Main row */}
                      <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {r.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                            <p className="text-xs text-gray-400">{r.totalRatings} rating{r.totalRatings !== 1 ? "s" : ""}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">{r.avgRating.toFixed(1)}</p>
                            {renderStars(r.avgRating)}
                          </div>
                          <button
                            onClick={() => toggleExpand(r.staffId)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all"
                            title="Show duties"
                          >
                            {expandedStaff[r.staffId] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded duties breakdown */}
                      {expandedStaff[r.staffId] && (
                        <div className="border-t border-gray-100 bg-gray-50/80 px-5 py-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duties rated across</p>
                          <div className="flex flex-wrap gap-2">
                            {r.duties.map((d, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-medium"
                              >
                                <span className="font-semibold">Floor {d.floor}</span>
                                <span className="text-purple-400">·</span>
                                {JANITOR_ROLE_LABELS[d.janitorType] || d.janitorType}
                              </span>
                            ))}
                            {r.duties.length === 0 && (
                              <span className="text-xs text-gray-400">No duty breakdown available</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TICKETS VIEW ─────────────────────────────────────────────────── */}
        {!["ratings", "staffDuties", "manageStaff"].includes(activeTab) && (
          <div className="relative w-full max-w-6xl overflow-hidden">
            <button
              onClick={() => setSlideIndex(prev => Math.max(prev - 1, 0))}
              className="absolute left-1/2 top-[70%] -translate-x-[120%] -translate-y-1/2 z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >◀</button>
            <button
              onClick={() => setSlideIndex(prev => prev + 1)}
              className="absolute left-1/2 top-[70%] translate-x-[20%] -translate-y-1/2 z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >▶</button>

            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${slideIndex * 50}%)` }}
            >
              {(tickets[activeTab] || []).length === 0 ? (
                <div className="w-full text-center text-gray-600 py-10">No tickets found.</div>
              ) : (
                (tickets[activeTab] || []).map((t) => (
                  <div key={t._id} className="w-1/2 px-6 shrink-0">
                    <div className="relative z-10 p-6 rounded-3xl shadow-2xl">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
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
                          <Button className="mt-4 w-full" onClick={() => updateStatus(t._id, "in-progress")}>
                            Mark as In-Progress
                          </Button>
                        )}
                        {t.status === "in-progress" && (
                          <Button className="mt-4 w-full" onClick={() => updateStatus(t._id, "resolved_pending")}>
                            Mark as Resolved (Pending)
                          </Button>
                        )}
                        {t.status === "resolved_pending" && (
                          <Button className="mt-4 w-full opacity-80" disabled>
                            Waiting for student confirmation
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="wave" /><div className="wave" /><div className="wave" />

      {/* ── ANNOUNCEMENT DIALOG ──────────────────────────────────────────────── */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="relative w-[600px] max-w-full mx-auto bg-white rounded-xl shadow-lg p-6">
          <button
            aria-label="Close dialog"
            onClick={() => setShowAnnouncementDialog(false)}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-indigo-800">Post New Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostAnnouncement} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text" required
                value={announcementForm.title}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter announcement title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
              <textarea
                required rows={6}
                value={announcementForm.content}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Enter announcement content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={announcementForm.priority}
                onChange={e => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={() => setShowAnnouncementDialog(false)} className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700">
                Post Announcement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
