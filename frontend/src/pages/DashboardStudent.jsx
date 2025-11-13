// // frontend/src/pages/DashboardStudent.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "./DashboardStudent.css";
// import TicketCard from "../components/TicketCard";
// import TicketSubmissionForm from "../components/TicketSubmissionForm";

// const DashboardStudent = () => {
//   const [userData, setUserData] = useState(null); // flattened: name, roomNumber, lastCleaned, caretaker, janitors, tickets, notifications
//   const [loading, setLoading] = useState(true);
//   const [ratings, setRatings] = useState({
//     roomCleaner: 0,
//     corridorCleaner: 0,
//     washroomCleaner: 0,
//   });
//   const [tickets, setTickets] = useState([]);
//   const [showTicketForm, setShowTicketForm] = useState(false);
//   const [ticketTitle, setTicketTitle] = useState("");
//   const [ticketDesc, setTicketDesc] = useState("");
//   // Fetch user info and flatten response
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await axios.get("http://localhost:3000/api/student/dashboard-student", {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });

//         // backend returns { user, room, tickets, notifications }
//         const payload = res.data;
//         const user = payload.user || {};
//         const room = payload.room || {};

//         // Flatten into one object that the UI expects
//         const flattened = {
//           // user fields
//           id: user._id,  // ✅ add
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           roomNumber: user.roomNumber,
//           // room fields (prefer room values if present)
//           lastCleaned: room.lastCleaned || null,
//           caretaker: room.caretaker || "Unassigned",
//           janitors: room.janitors || { roomCleaner: "N/A", corridorCleaner: "N/A", washroomCleaner: "N/A" },
//           // lists
//           tickets: payload.tickets || [],
//           notifications: payload.notifications || [],
//         };

//         setUserData(flattened);
//         // fetch student tickets
//         // const ticketRes = await axios.get(`http://localhost:3000/api/tickets/${payload.user._id}`, {
//         //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         // });
//         // ✅ CORRECT - Using email and correct path
// // Use the email retrieved from the first dashboard fetch
//         const studentEmail = payload.user.email; 

//         const ticketRes = await axios.get(`http://localhost:3000/api/tickets/student/${studentEmail}`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setTickets(ticketRes.data);

//       } catch (err) {
//         console.error("Error fetching dashboard data:", err);
//         alert("Failed to load dashboard. Please login again.");
//         localStorage.clear();
//         window.location.href = "/";
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Mark as clean -> backend returns { message, room }
//   const handleMarkClean = async () => {
//     try {
//       const res = await axios.post(
//         "http://localhost:3000/api/student/mark-clean",
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
//       alert(res.data.message || "Marked clean");

//       // Update flattened state using returned room
//       const room = res.data.room || {};
//       setUserData((prev) => ({
//         ...prev,
//         lastCleaned: room.lastCleaned || new Date().toISOString(),
//         caretaker: room.caretaker || prev?.caretaker,
//         janitors: room.janitors || prev?.janitors,
//       }));
//     } catch (err) {
//       console.error("Error marking clean:", err);
//       alert("Failed to mark clean");
//     }
//   };

//   // Submit ratings -> backend expects { ratings }
//   const handleRate = async () => {
//     try {
//       // Ensure ratings are numbers
//       const payloadRatings = {
//         roomCleaner: Number(ratings.roomCleaner) || 0,
//         corridorCleaner: Number(ratings.corridorCleaner) || 0,
//         washroomCleaner: Number(ratings.washroomCleaner) || 0,
//       };

//       const res = await axios.post(
//         "http://localhost:3000/api/student/rate",
//         { ratings: payloadRatings },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
//       alert(res.data.message || "Ratings submitted");
//       // reset local ratings UI
//       setRatings({ roomCleaner: 0, corridorCleaner: 0, washroomCleaner: 0 });
//       // no room update expected from /rate, so we keep existing userData
//     } catch (err) {
//       console.error("Error submitting ratings:", err);
//       alert("Failed to submit ratings");
//     }
//   };
//   const raiseTicket = async () => {
//     if (!ticketTitle.trim()) {
//       alert("Please enter a ticket title.");
//       return;
//     }
  
//     try {
//       const res = await axios.post(
//         "http://localhost:3000/api/tickets/create",
//         {
//           studentId: userData.id,

//           studentEmail: userData.email, // ✅ using from fetched userData
//           roomNumber: userData.roomNumber,
//           title: ticketTitle,
//           description: ticketDesc,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );
  
//       alert("Ticket raised successfully!");
//       setShowTicketForm(false);
//       setTicketTitle("");
//       setTicketDesc("");
//       setTickets((prev) => [res.data.ticket, ...prev]);
//     } catch (error) {
//       console.error("Error creating ticket:", error);
//       alert("Failed to raise ticket");
//     }
//   };
  
  
//   if (loading) return <div className="loading">Loading...</div>;
//   if (!userData) return <div className="loading">Failed to load dashboard data.</div>;

//   return (
//     <div className="dashboard-container">
//       <h1 className="funky-font">Welcome, {userData.name} 👋</h1>

//       <div className="room-info">
//         <h2>Room Information</h2>
//         <p><strong>Room Number:</strong> {userData.roomNumber || "N/A"}</p>
//         <p>
//           <strong>Last Cleaned:</strong>{" "}
//           {userData.lastCleaned ? new Date(userData.lastCleaned).toLocaleString() : "Not yet cleaned"}
//         </p>
//         <p><strong>Assigned Caretaker:</strong> {userData.caretaker}</p>
//       </div>

//       <div className="janitor-info">
//         <h2>Janitors Assigned</h2>
//         <p><strong>Room Cleaner:</strong> {userData.janitors?.roomCleaner || "N/A"}</p>
//         <p><strong>Corridor Cleaner:</strong> {userData.janitors?.corridorCleaner || "N/A"}</p>
//         <p><strong>Washroom Cleaner:</strong> {userData.janitors?.washroomCleaner || "N/A"}</p>
//       </div>

//       <button className="btn" onClick={handleMarkClean}>✅ Mark as Clean</button>

//       <div className="rating-section">
//         <h2>Rate Janitors</h2>

//         <div style={{ marginBottom: 8 }}>
//           <label>Room Cleaner ({userData.janitors?.roomCleaner || "N/A"}): </label>
//           <input
//             type="number"
//             min="1"
//             max="5"
//             value={ratings.roomCleaner}
//             onChange={(e) => setRatings((r) => ({ ...r, roomCleaner: e.target.value }))}
//           />
//         </div>

//         <div style={{ marginBottom: 8 }}>
//           <label>Corridor Cleaner ({userData.janitors?.corridorCleaner || "N/A"}): </label>
//           <input
//             type="number"
//             min="1"
//             max="5"
//             value={ratings.corridorCleaner}
//             onChange={(e) => setRatings((r) => ({ ...r, corridorCleaner: e.target.value }))}
//           />
//         </div>

//         <div style={{ marginBottom: 8 }}>
//           <label>Washroom Cleaner ({userData.janitors?.washroomCleaner || "N/A"}): </label>
//           <input
//             type="number"
//             min="1"
//             max="5"
//             value={ratings.washroomCleaner}
//             onChange={(e) => setRatings((r) => ({ ...r, washroomCleaner: e.target.value }))}
//           />
//         </div>

//         <button className="btn" onClick={handleRate}>⭐ Submit Ratings</button>
//       </div>
//       <hr />

// <div className="ticket-section">
//   <h2>🧾 Raise a Ticket</h2>

//   <button className="btn" onClick={() => setShowTicketForm(!showTicketForm)}>
//     {showTicketForm ? "Cancel" : "➕ New Ticket"}
//   </button>

//   {showTicketForm && (
//   <TicketSubmissionForm
//     roomNumber={userData.roomNumber}
//     onSubmit={({ title, description }) => {
//       setTicketTitle(title);
//       setTicketDesc(description);
//       raiseTicket();
//     }}
//   />
// )}


//   <div className="tickets-list">
//     <h3>Your Previous Tickets</h3>
//     {tickets.length === 0 ? (
//       <p>No tickets raised yet.</p>
//     ) : (
//       <div className="grid gap-4 mt-4">
//         {tickets.map((ticket) => (
//           <TicketCard
//             key={ticket._id}
//             ticket={{
//               id: ticket._id,
//               issue: ticket.title,
//               description: ticket.description,
//               status: ticket.status,
//               floor: userData.roomNumber?.split("-")[0] || "N/A",
//               roomNumber: userData.roomNumber,
//               submittedAt: new Date(ticket.createdAt).toLocaleString(),
//               submittedBy: userData.name,
//               assignedTo: ticket.assignedTo || "Not yet assigned",
//             }}
//             onClick={() => console.log("Clicked ticket:", ticket._id)}
//           />
//         ))}
//       </div>

//     )}
//   </div>
// </div>

//     </div>
//   );
// };

// export default DashboardStudent;
// src/pages/DashboardStudent.jsx
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
      <div className="max-w-7xl mx-auto page-shell space-y-6">
        {/* 🧭 Top Header Band */}
        <div className="w-full bg-white shadow-md z-40">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left side: Title + Subtitle */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-green-700">
                Student Dashboard
              </h1>
              <p className="mt-1 text-sm md:text-base text-slate-600">
                Manage your room cleanliness and sanitation — overview, tickets and reporting
              </p>
            </div>

            {/* Right side: Logout Button */}
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/"; // or use navigate("/login") if you have React Router
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 card-solid">
            <CardHeader className="flex items-center justify-between pb-4">
              <CardTitle>Room Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <div className="text-primary text-2xl">📍</div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Room</p>
                    <p className="font-semibold">{userData.roomNumber || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <div className="text-primary text-2xl">👤</div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Caretaker</p>
                    <p className="font-semibold">{userData.caretaker || "Unassigned"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <div className="text-primary text-2xl">📅</div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Cleaned</p>
                    <p className="font-semibold">{userData.lastCleaned ? new Date(userData.lastCleaned).toLocaleString() : "Not yet cleaned"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <div className="h-10 w-10 rounded-full bg-status-resolved flex items-center justify-center">
                    <span className="text-xs text-white font-bold">—</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Compliance Score</p>
                    <p className="font-semibold">—</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full" onClick={() => setShowSubmitForm(true)} variant="primary" >
                  ➕ Report Issue
                </Button>
              </div>
            </CardContent>
          </Card>

          <CleaningStatusMarker
            className="card-solid"
            roomNumber={userData.roomNumber}
            lastCleaned={userData.lastCleaned}
            caretaker={userData.caretaker}
            onMarkClean={handleMarkClean}
          />
        </div>

        <div>
          <div className="heading-shell inline-block mb-4">
            <h2 className="text-2xl font-semibold m-0">Your Tickets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.length === 0 ? (
              <p>No tickets raised yet.</p>
            ) : (
              tickets.map(t => <TicketCard key={t._id || t.id} ticket={t} />)
            )}
          </div>
        </div>
        <StaffRating />

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