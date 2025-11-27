import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import Button from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import TicketCard from "../components/TicketCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export default function DashboardCaretaker() {
  const [tickets, setTickets] = useState({ open: [], inProcess: [], resolved: [] });
  const [activeTab, setActiveTab] = useState("open");
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [staffRatings, setStaffRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingFilters, setRatingFilters] = useState({
    janitorType: "all",
    floor: "all",
    sortOrder: "desc"
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    priority: "medium"
  });
  
  useEffect(() => {
    setSlideIndex(0);
  }, [activeTab]);
    const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/caretaker/tickets/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const updated = res.data.ticket;

      // Remove ticket from its old category and place into correct one
      setTickets(prev => {
        const open = prev.open.filter(t => t._id !== id);
        const inProcess = prev.inProcess.filter(t => t._id !== id);
        const resolved = prev.resolved.filter(t => t._id !== id);

        if (newStatus === "in-process") inProcess.push(updated);
        if (newStatus === "resolved") resolved.push(updated);

        return {
          open: open.sort((a, b) => b.aiConfidence - a.aiConfidence),
          inProcess,
          resolved,
        };
      });
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update ticket");
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/caretaker/tickets`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const all = res.data.tickets || [];

        // Basic categorisation
        const open = all.filter(t => t.status === "open")
                        .sort((a, b) => b.aiConfidence - a.aiConfidence);

        const inProcess = all.filter(t => t.status === "in-process");
        const resolved = all.filter(t => t.status === "resolved");

        setTickets({ open, inProcess, resolved });
      } catch (err) {
        console.error("Error fetching caretaker tickets:", err);
        alert("Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Fetch staff ratings when ratings tab is active
  useEffect(() => {
    if (activeTab === "ratings") {
      fetchStaffRatings();
    }
  }, [activeTab, ratingFilters]);

  const fetchStaffRatings = async () => {
    setRatingsLoading(true);
    try {
      const params = new URLSearchParams({
        janitorType: ratingFilters.janitorType,
        floor: ratingFilters.floor,
        sortOrder: ratingFilters.sortOrder
      });
      
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/caretaker/staff-ratings?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      
      setStaffRatings(res.data.ratings || []);
    } catch (err) {
      console.error("Error fetching staff ratings:", err);
      alert("Failed to load staff ratings");
    } finally {
      setRatingsLoading(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/caretaker/announcements`,
        announcementForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      alert("Announcement posted successfully!");
      setShowAnnouncementDialog(false);
      setAnnouncementForm({
        title: "",
        content: "",
        priority: "medium"
      });
    } catch (err) {
      console.error("Error posting announcement:", err);
      alert("Failed to post announcement");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );

  return (
      <div className="w-full min-h-screen">
      {/* ========= FULL-WIDTH HEADER (SEPARATE, LIKE STUDENT) ========= */}
      <div className="w-full bg-white border-b border-gray-100 shadow-sm z-40 relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30"></div>
        
        {/* Refined accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        <div className="relative w-full py-6 px-6 sm:px-10 lg:px-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Elegant icon container */}
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
                Caretaker Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 font-normal">
                Manage sanitation tickets for your assigned areas
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="group relative px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 overflow-hidden"
          >
            {/* Button shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline relative z-10">Logout</span>
          </button>
        </div>

        {/* Tabs row aligned with title */}
        <div className="relative w-full px-6 sm:px-10 lg:px-14 border-t border-gray-100">
          <div className="flex gap-2 pt-3 pb-3">
            <button
              onClick={() => setActiveTab("open")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "open"
                  ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
          Open Tickets
        </button>

            <button
              onClick={() => setActiveTab("inProcess")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "inProcess"
                  ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
          In-Process
        </button>

            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "resolved"
                  ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
          Resolved
        </button>

            <button
              onClick={() => setActiveTab("ratings")}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "ratings"
                  ? "bg-purple-50 text-purple-700 shadow-sm border border-purple-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              Staff Ratings
            </button>

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
      {/* ========= MAIN CONTENT: TABS + TICKET CARDS (CENTERED) ========= */}
      <div className="flex justify-center min-h-[calc(100vh-96px)] mt-6">
        {activeTab === "ratings" ? (
          /* ========= STAFF RATINGS VIEW ========= */
          <div className="w-full max-w-6xl px-6">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Staff Performance Ratings</h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Janitor Type</label>
                  <select
                    value={ratingFilters.janitorType}
                    onChange={(e) => setRatingFilters(prev => ({ ...prev, janitorType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="roomCleaner">Room Cleaner</option>
                    <option value="corridorCleaner">Corridor Cleaner</option>
                    <option value="washroomCleaner">Washroom Cleaner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                  <select
                    value={ratingFilters.floor}
                    onChange={(e) => setRatingFilters(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Floors</option>
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                    <option value="3">Floor 3</option>
                    <option value="4">Floor 4</option>
                    <option value="5">Floor 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                  <select
                    value={ratingFilters.sortOrder}
                    onChange={(e) => setRatingFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="desc">Highest First</option>
                    <option value="asc">Lowest First</option>
                  </select>
                </div>
              </div>

              {/* Ratings Table */}
              {ratingsLoading ? (
                <div className="text-center py-10 text-gray-600">Loading ratings...</div>
              ) : staffRatings.length === 0 ? (
                <div className="text-center py-10 text-gray-600">No ratings found for the selected filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Floor</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Janitor Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Janitor Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Average Rating</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Ratings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffRatings.map((rating, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">Floor {rating.floor}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {rating.janitorType === "roomCleaner" ? "Room Cleaner" :
                             rating.janitorType === "corridorCleaner" ? "Corridor Cleaner" :
                             "Washroom Cleaner"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">{rating.janitorName || "N/A"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-purple-600">{rating.avgRating.toFixed(2)}</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= Math.round(rating.avgRating)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{rating.totalRatings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========= TICKETS VIEW ========= */
          <div className="relative w-full max-w-6xl overflow-hidden">
            {/* LEFT ARROW */}
            <button
              onClick={() => setSlideIndex(prev => Math.max(prev - 1, 0))}
              className="absolute left-1/2 top-[70%] -translate-x-[120%] -translate-y-1/2 z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >
              ◀
            </button>

            {/* RIGHT ARROW */}
            <button
              onClick={() => setSlideIndex(prev => prev + 1)}
              className="absolute left-1/2 top-[70%] translate-x-[20%] -translate-y-1/2 z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >
              ▶
            </button>

            {/* SLIDING TRACK */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${slideIndex * 50}%)` }}
            >
              {(tickets[activeTab] || []).length === 0 ? (
                <div className="w-full text-center text-gray-600 py-10">
                  No tickets found.
                </div>
              ) : (
                (tickets[activeTab] || []).map((t) => (
                  <div key={t._id} className="w-1/2 px-6 shrink-0">
                    {/* ✅ INDIVIDUAL GLASS PANEL */}
                    <div className="relative z-10 p-6 rounded-3xl shadow-2xl transition-transform duration-500">
                      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                        <TicketCard
                          ticket={{
                            title: t.title,
                            roomNumber: t.roomNumber,
                            floor: t.floor || "-",
                            submittedAt: new Date(t.createdAt).toLocaleString(),
                            status: t.status === "open" ? "pending" : t.status,
                            description: t.description,
                            aiConfidence: t.aiConfidence,
                            submittedBy: t.studentEmail,
                          }}
                        />

                        {t.status !== "resolved" && (
                          <Button
                            className="mt-4 w-full"
                            onClick={() =>
                              updateStatus(
                                t._id,
                                t.status === "open" ? "in-process" : "resolved"
                              )
                            }
                          >
                            {t.status === "open"
                              ? "Mark as In-Process"
                              : "Mark as Resolved"}
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

      {/* 🌊 background waves unchanged */}
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="relative w-[600px] max-w-full mx-auto bg-white rounded-xl shadow-lg p-6">
          {/* Close button */}
          <button
            aria-label="Close dialog"
            onClick={() => setShowAnnouncementDialog(false)}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition"
          >
            <svg 
              className="w-5 h-5 text-gray-700"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center text-indigo-800">
              Post New Announcement
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePostAnnouncement} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                required
                rows={6}
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Enter announcement content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={() => setShowAnnouncementDialog(false)}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Post Announcement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

