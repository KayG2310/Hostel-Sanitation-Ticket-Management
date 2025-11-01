// frontend/src/pages/DashboardStudent.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./DashboardStudent.css";

const DashboardStudent = () => {
  const [userData, setUserData] = useState(null); // flattened: name, roomNumber, lastCleaned, caretaker, janitors, tickets, notifications
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({
    roomCleaner: 0,
    corridorCleaner: 0,
    washroomCleaner: 0,
  });
  const [tickets, setTickets] = useState([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  // Fetch user info and flatten response
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/student/dashboard-student", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // backend returns { user, room, tickets, notifications }
        const payload = res.data;
        const user = payload.user || {};
        const room = payload.room || {};

        // Flatten into one object that the UI expects
        const flattened = {
          // user fields
          id: user._id,  // ✅ add
          name: user.name,
          email: user.email,
          role: user.role,
          roomNumber: user.roomNumber,
          // room fields (prefer room values if present)
          lastCleaned: room.lastCleaned || null,
          caretaker: room.caretaker || "Unassigned",
          janitors: room.janitors || { roomCleaner: "N/A", corridorCleaner: "N/A", washroomCleaner: "N/A" },
          // lists
          tickets: payload.tickets || [],
          notifications: payload.notifications || [],
        };

        setUserData(flattened);
        // fetch student tickets
        // const ticketRes = await axios.get(`http://localhost:3000/api/tickets/${payload.user._id}`, {
        //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        // });
        // ✅ CORRECT - Using email and correct path
// Use the email retrieved from the first dashboard fetch
        const studentEmail = payload.user.email; 

        const ticketRes = await axios.get(`http://localhost:3000/api/tickets/student/${studentEmail}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTickets(ticketRes.data);

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

  // Mark as clean -> backend returns { message, room }
  const handleMarkClean = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/api/student/mark-clean",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert(res.data.message || "Marked clean");

      // Update flattened state using returned room
      const room = res.data.room || {};
      setUserData((prev) => ({
        ...prev,
        lastCleaned: room.lastCleaned || new Date().toISOString(),
        caretaker: room.caretaker || prev?.caretaker,
        janitors: room.janitors || prev?.janitors,
      }));
    } catch (err) {
      console.error("Error marking clean:", err);
      alert("Failed to mark clean");
    }
  };

  // Submit ratings -> backend expects { ratings }
  const handleRate = async () => {
    try {
      // Ensure ratings are numbers
      const payloadRatings = {
        roomCleaner: Number(ratings.roomCleaner) || 0,
        corridorCleaner: Number(ratings.corridorCleaner) || 0,
        washroomCleaner: Number(ratings.washroomCleaner) || 0,
      };

      const res = await axios.post(
        "http://localhost:3000/api/student/rate",
        { ratings: payloadRatings },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert(res.data.message || "Ratings submitted");
      // reset local ratings UI
      setRatings({ roomCleaner: 0, corridorCleaner: 0, washroomCleaner: 0 });
      // no room update expected from /rate, so we keep existing userData
    } catch (err) {
      console.error("Error submitting ratings:", err);
      alert("Failed to submit ratings");
    }
  };
  const raiseTicket = async () => {
    if (!ticketTitle.trim()) {
      alert("Please enter a ticket title.");
      return;
    }
  
    try {
      const res = await axios.post(
        "http://localhost:3000/api/tickets/create",
        {
          studentId: userData.id,

          studentEmail: userData.email, // ✅ using from fetched userData
          roomNumber: userData.roomNumber,
          title: ticketTitle,
          description: ticketDesc,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      alert("Ticket raised successfully!");
      setShowTicketForm(false);
      setTicketTitle("");
      setTicketDesc("");
      setTickets((prev) => [res.data.ticket, ...prev]);
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to raise ticket");
    }
  };
  
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!userData) return <div className="loading">Failed to load dashboard data.</div>;

  return (
    <div className="dashboard-container">
      <h1 className="funky-font">Welcome, {userData.name} 👋</h1>

      <div className="room-info">
        <h2>Room Information</h2>
        <p><strong>Room Number:</strong> {userData.roomNumber || "N/A"}</p>
        <p>
          <strong>Last Cleaned:</strong>{" "}
          {userData.lastCleaned ? new Date(userData.lastCleaned).toLocaleString() : "Not yet cleaned"}
        </p>
        <p><strong>Assigned Caretaker:</strong> {userData.caretaker}</p>
      </div>

      <div className="janitor-info">
        <h2>Janitors Assigned</h2>
        <p><strong>Room Cleaner:</strong> {userData.janitors?.roomCleaner || "N/A"}</p>
        <p><strong>Corridor Cleaner:</strong> {userData.janitors?.corridorCleaner || "N/A"}</p>
        <p><strong>Washroom Cleaner:</strong> {userData.janitors?.washroomCleaner || "N/A"}</p>
      </div>

      <button className="btn" onClick={handleMarkClean}>✅ Mark as Clean</button>

      <div className="rating-section">
        <h2>Rate Janitors</h2>

        <div style={{ marginBottom: 8 }}>
          <label>Room Cleaner ({userData.janitors?.roomCleaner || "N/A"}): </label>
          <input
            type="number"
            min="1"
            max="5"
            value={ratings.roomCleaner}
            onChange={(e) => setRatings((r) => ({ ...r, roomCleaner: e.target.value }))}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Corridor Cleaner ({userData.janitors?.corridorCleaner || "N/A"}): </label>
          <input
            type="number"
            min="1"
            max="5"
            value={ratings.corridorCleaner}
            onChange={(e) => setRatings((r) => ({ ...r, corridorCleaner: e.target.value }))}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Washroom Cleaner ({userData.janitors?.washroomCleaner || "N/A"}): </label>
          <input
            type="number"
            min="1"
            max="5"
            value={ratings.washroomCleaner}
            onChange={(e) => setRatings((r) => ({ ...r, washroomCleaner: e.target.value }))}
          />
        </div>

        <button className="btn" onClick={handleRate}>⭐ Submit Ratings</button>
      </div>
      <hr />

<div className="ticket-section">
  <h2>🧾 Raise a Ticket</h2>

  <button className="btn" onClick={() => setShowTicketForm(!showTicketForm)}>
    {showTicketForm ? "Cancel" : "➕ New Ticket"}
  </button>

  {showTicketForm && (
    <div className="ticket-form">
      <input
        type="text"
        placeholder="Ticket Title"
        value={ticketTitle}
        onChange={(e) => setTicketTitle(e.target.value)}
      />
      <textarea
        placeholder="Describe your issue..."
        value={ticketDesc}
        onChange={(e) => setTicketDesc(e.target.value)}
      />
      <button className="btn" onClick={raiseTicket}>Submit Ticket</button>
    </div>
  )}

  <div className="tickets-list">
    <h3>Your Previous Tickets</h3>
    {tickets.length === 0 ? (
      <p>No tickets raised yet.</p>
    ) : (
      <ul>
        {tickets.map((t) => (
          <li key={t._id}>
            <strong>{t.title}</strong> — {t.status}
            <br />
            <small>{new Date(t.createdAt).toLocaleString()}</small>
            <p>{t.description}</p>
          </li>
        ))}
      </ul>
    )}
  </div>
</div>

    </div>
  );
};

export default DashboardStudent;
