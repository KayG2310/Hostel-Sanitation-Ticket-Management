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
      <div className="w-full bg-white shadow-md z=40">
        <div className="w-full py-6 px-4 sm:px-10 lt:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-700">
              Caretaker Dashboard
            </h1>
            <p className="mt-1 text-sm md:text-base text-slate-600">
              Manage sanitation tickets for your assigned areas
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition font-medium"
          >
            Logout
          </button>
        </div>

        {/* Grey divider line */}
        <div className="border-t border-gray-200 mt-0.3"></div>

        {/* Tabs row aligned with title */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex gap-5 pt-3 pb-2">
            <button
              onClick={() => setActiveTab("open")}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === "open"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Open Tickets
            </button>

            <button
              onClick={() => setActiveTab("inProcess")}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === "inProcess"
                  ? "bg-yellow-100 text-yellow-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              In-Process
            </button>

            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === "resolved"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
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

