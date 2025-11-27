import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import Button from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import TicketCard from "../components/TicketCard";

export default function DashboardCaretaker() {
  const [tickets, setTickets] = useState({ open: [], inProcess: [], resolved: [] });
  const [activeTab, setActiveTab] = useState("open");
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  
  useEffect(() => {
    setSlideIndex(0);
  }, [activeTab]);
    const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/api/caretaker/tickets/${id}/status`,
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
        const res = await axios.get("http://localhost:3000/api/caretaker/tickets", {
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
          </div>
        </div>
      </div>
      {/* ========= MAIN CONTENT: TABS + TICKET CARDS (CENTERED) ========= */}
      <div className="flex justify-center min-h-[calc(100vh-96px)] mt-6">

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
                          status:
                            t.status === "open" ? "pending" : t.status,
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
                              t.status === "open"
                                ? "in-process"
                                : "resolved"
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
      </div>

      {/* 🌊 background waves unchanged */}
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
    </div>
  );
}

