
import React, { useEffect, useState } from "react";
import axios from "axios";

import TicketCard from "../components/TicketCard";
import CleaningStatusMarker from "../components/CleaningStatusMarker";
import TicketSubmissionForm from "../components/TicketSubmissionForm";
import StaffRating from "../components/StaffRating";

import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import Button from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export default function DashboardStudent() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    setSlideIndex(0);
  }, [tickets]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/student/dashboard-student", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const payload = res.data || {};
        const user = payload.user || {};
        const room = payload.room || {};

        const flattened = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          roomNumber: user.roomNumber || room.roomNumber,
          lastCleaned: room.lastCleaned || null,
          caretaker: room.caretaker || "Unassigned",
          janitors: room.janitors || { roomCleaner: "N/A", corridorCleaner: "N/A", washroomCleaner: "N/A" },
          tickets: payload.tickets || [],
          notifications: payload.notifications || [],
        };

        setUserData(flattened);

        const studentEmail = user.email;
        if (studentEmail) {
          const ticketRes = await axios.get(`http://localhost:3000/api/tickets/student/${studentEmail}`, {
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

    fetchData();
  }, []);

  const handleMarkClean = async () => {
    try {
      const res = await axios.post("http://localhost:3000/api/student/mark-clean", {}, {
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
      const res = await axios.post("http://localhost:3000/api/tickets/create", {
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
        <div className="w-full bg-white shadow-md z-40">
          <div className="w-full py-6 px-4 sm:px-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-green-700">
                Student Dashboard
              </h1>
              <p className="mt-1 text-sm md:text-base text-slate-600">
                Manage your room cleanliness and sanitation — overview, tickets and reporting
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/";
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition font-medium"
            >
              Logout
            </button>
          </div>

          <div className="border-t border-gray-200"></div>
        </div>




        <div className="flex justify-center mt-8">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* GLASS ROOM INFO */}
            <div className="relative z-10 p-6 rounded-3xl shadow-2xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">

                <h2 className="text-2xl font-semibold text-green-800 mb-6">
                  Room Information
                </h2>

                <div className="flex flex-col justify-between min-h-[260px]">

                  <div className="grid grid-cols-2 gap-10 text-base">
                    <div>
                      <p className="text-sm text-gray-500">Room</p>
                      <p className="font-semibold text-lg">{userData.roomNumber}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Caretaker</p>
                      <p className="font-semibold text-lg">{userData.caretaker}</p>
                    </div>

                    <div>
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

            {/* GLASS CLEANING STATUS */}
            <div className="relative z-10 p-6 rounded-3xl shadow-2xl">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                <CleaningStatusMarker
                  roomNumber={userData.roomNumber}
                  lastCleaned={userData.lastCleaned}
                  caretaker={userData.caretaker}
                  onMarkClean={handleMarkClean}
                />
              </div>
            </div>

          </div>
        </div>


        <div className="mt-12 flex justify-center">
          <div className="relative w-full max-w-6xl overflow-hidden">

            <h2 className="text-2xl font-semibold text-white-700 mb-6">
              Your Tickets
            </h2>

            {/* LEFT ARROW */}
            <button
              onClick={() => setSlideIndex(prev => Math.max(prev - 1, 0))}
              className="absolute left-1/2 top-[80%] -translate-x-[130%] -translate-y-1/2 z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >
              ◀
            </button>

            {/* RIGHT ARROW */}
            <button
              onClick={() => setSlideIndex(prev => prev + 1)}
              className="absolute left-1/2 top-[80%] translate-x-[30%] -translate-y-1/2 z-30 bg-white/70 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center shadow hover:scale-105 transition"
            >
              ▶
            </button>

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
        <DialogContent className="relative w-[500px] max-w-full bg-white rounded-xl shadow-lg p-6">
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