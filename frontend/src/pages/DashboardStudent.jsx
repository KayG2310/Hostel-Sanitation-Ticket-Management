
import React, { useEffect, useState } from "react";
import axios from "axios";

import TicketCard from "../components/TicketCard";
import TicketSubmissionForm from "../components/TicketSubmissionForm";
import StaffRating from "../components/StaffRating";

import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import Button from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export default function DashboardStudent() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    setSlideIndex(0);
  }, [tickets]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/student/dashboard-student`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const payload = res.data || {};
        const user = payload.user || {};
        const room = payload.room || {};

        // Backend now always returns caretaker name (or "Unassigned" if none exists)
        const caretakerName = room.caretaker || "Unassigned";

        const flattened = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          roomNumber: user.roomNumber || room.roomNumber,
          lastCleaned: room.lastCleaned || null,
          caretaker: caretakerName,
          janitors: room.janitors || { roomCleaner: "N/A", corridorCleaner: "N/A", washroomCleaner: "N/A" },
          tickets: payload.tickets || [],
          notifications: payload.notifications || [],
        };

        setUserData(flattened);

        const studentEmail = user.email;
        if (studentEmail) {
          const ticketRes = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/tickets/student/${studentEmail}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setTickets(ticketRes.data || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        alert("Failed to load dashboard. Please login again.");
        localStorage.clear();
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/student/announcements`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAnnouncements(res.data.announcements || []);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };

    fetchData();
    fetchAnnouncements();
  }, []);

  const handleMarkClean = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/student/mark-clean`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert(res.data.message || "Marked clean");
      const room = res.data.room || {};
      setUserData(prev => ({ ...prev, lastCleaned: room.lastCleaned || new Date().toISOString(), caretaker: room.caretaker || prev?.caretaker, janitors: room.janitors || prev?.janitors }));
    } catch (err) {
      console.error("Error marking clean:", err);
      alert("Failed to mark clean");
    }
  };

  const handleTicketCreate = async (payload) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL}/api/tickets/create`, {
        studentId: userData.id,
        studentEmail: userData.email,
        roomNumber: payload.roomNumber || userData.roomNumber,
        title: payload.title,
        description: payload.description,
        photo: payload.photo || null,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const created = res.data.ticket || res.data;
      setTickets(prev => [created, ...prev]);
      setShowSubmitForm(false);
      alert("Ticket raised successfully!");
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert("Failed to raise ticket");
    }
  };
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!userData) return <div className="min-h-screen flex items-center justify-center">Failed to load dashboard data.</div>;

  return (
    <div className="min-h-screen">
      <div className="w-full min-h-screen">
        {/* ========= FULL WIDTH HEADER ========= */}
        <div className="w-full bg-white border-b border-gray-100 shadow-sm z-40 relative">
          {/* Subtle background texture with green/emerald tones */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-white to-green-50/30"></div>
          
          {/* Refined accent line at top - green/emerald gradient */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-500"></div>
          
          <div className="relative w-full py-4 px-4 sm:px-8 lg:px-11 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Elegant icon container - green/emerald theme */}
              <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight leading-tight">
                  Student Dashboard
                </h1>
                <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500 font-normal">
                  Manage your room cleanliness and sanitation — overview, tickets and reporting
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/";
              }}
              className="group relative px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 overflow-hidden"
            >
              {/* Button shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <svg className="w-3.5 h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline relative z-10">Logout</span>
            </button>
          </div>
        </div>




        <div className="flex justify-center mt-8">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* GLASS ROOM INFO */}
            <div className="relative z-10 p-6 rounded-3xl shadow-2xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">

                <h2 className="text-2xl font-semibold text-green-800 mb-6">
                  Room Information
                </h2>

                <div className="flex flex-col justify-between h-[300px]">

                  <div className="space-y-6 gap-10 text-base">
                    <div>
                      <p className="text-sm text-gray-500">Room</p>
                      <p className="font-semibold text-lg">{userData.roomNumber}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Caretaker</p>
                      <p className="font-semibold text-lg">{userData.caretaker}</p>
                      <Button
                        onClick={handleMarkClean}
                        className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        ✓ Mark as Clean
                      </Button>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Last Cleaned</p>
                      <p className="font-semibold text-lg">
                        {userData.lastCleaned
                          ? new Date(userData.lastCleaned).toLocaleString()
                          : "Not yet cleaned"}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-8"
                    onClick={() => setShowSubmitForm(true)}
                  >
                    ➕ Report Issue
                  </Button>
                </div>
              </div>
            </div>

            {/* GLASS ANNOUNCEMENTS */}
            <div className="relative z-10 p-6 rounded-3xl shadow-2xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-semibold text-green-800 mb-6">
                  Latest Announcements
                </h2>

                <div className="flex flex-col justify-between h-[300px]">
                  <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {announcements.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p>No announcements in the last 7 days.</p>
                      </div>
                    ) : (
                      announcements.map((announcement) => {
                        const priorityColors = {
                          high: "bg-red-100 text-red-800 border-red-300",
                          medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
                          low: "bg-blue-100 text-blue-800 border-blue-300"
                        };
                        
                        return (
                          <div
                            key={announcement._id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {announcement.title}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded border ${
                                  priorityColors[announcement.priority] || priorityColors.medium
                                }`}
                              >
                                {announcement.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">
                              {announcement.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                By {announcement.postedByName || announcement.postedBy?.name || "Caretaker"}
                              </span>
                              <span>
                                {new Date(announcement.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>


        <div className="mt-12 flex justify-center">
          <div className="relative w-full max-w-6xl pb-20">
            <div className="overflow-hidden">
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-green-800 mb-2">
                  Your Tickets
                </h2>
                <div className="h-1 w-24 bg-green-600 rounded-full"></div>
              </div>

              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${slideIndex * 50}%)` }}
              >
                {tickets.length === 0 ? (
                  <div className="w-full text-center text-gray-600 py-20">
                    No tickets raised yet.
                  </div>
                ) : (
                  tickets.map(t => (
                    <div key={t._id || t.id} className="w-1/2 px-6 shrink-0">
                      <div className="relative z-10 p-6 rounded-3xl shadow-2xl">
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                          <TicketCard ticket={t} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* LEFT ARROW - positioned below tickets */}
            <button
              onClick={() => setSlideIndex(prev => Math.max(prev - 1, 0))}
              className="absolute left-1/2 bottom-0 -translate-x-[130%] z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >
              ◀
            </button>

            {/* RIGHT ARROW - positioned below tickets */}
            <button
              onClick={() => setSlideIndex(prev => prev + 1)}
              className="absolute left-1/2 bottom-0 translate-x-[30%] z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="flex justify-center mt-20 pb-10">
          <div className="w-full max-w-7xl">
            <div className="relative z-10 p-6 rounded-3xl shadow-2xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                <StaffRating />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSubmitForm} onOpenChange={setShowSubmitForm}>
        <DialogContent className="relative w-[500px] max-w-full mx-auto bg-white rounded-xl shadow-lg p-6">
          {/* Close button top-right */}
          <button
            aria-label="Close dialog"
            onClick={() => setShowSubmitForm(false)}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100 transition"
          >
            {/* simple X icon (SVG) */}
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
            <DialogTitle className="text-xl font-semibold text-center text-green-800">Submit Sanitation Ticket</DialogTitle>
          </DialogHeader>

          {/* Form Content (auto height) */}
          <div className="mt-4 space-y-4">
          <TicketSubmissionForm
            roomNumber={userData.roomNumber}
            onSubmit={(ticket) => {
              setTickets(prev => [ticket, ...prev]);
              setShowSubmitForm(false);
            }}
          />

          </div>
        </DialogContent>
      </Dialog>

      {/* 🌊 Animated background waves */}
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
    </div>
  );
}