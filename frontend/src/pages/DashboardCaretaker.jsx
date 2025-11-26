import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DashboardCaretaker() {
  const [tickets, setTickets] = useState({ open: [], inProcess: [], resolved: [] });
  const [activeTab, setActiveTab] = useState("open");
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading…</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Caretaker Dashboard</h1>

      {/* TAB BUTTONS */}
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("open")} style={{ marginRight: "10px" }}>
          Open Tickets
        </button>
        <button onClick={() => setActiveTab("inProcess")} style={{ marginRight: "10px" }}>
          In-Process
        </button>
        <button onClick={() => setActiveTab("resolved")}>
          Resolved
        </button>
      </div>

      {/* TAB CONTENT */}
      <div style={{ marginTop: "20px" }}>
        {activeTab === "open" && (
          <>
            <h2>Open Tickets (sorted by AI confidence)</h2>
            {tickets.open.length === 0 ? (
              <p>No open tickets</p>
            ) : (
                tickets.open.map(t => (
                    <div key={t._id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                      <p><b>{t.title}</b></p>
                      <p>{t.description}</p>
                      <p>Room: {t.roomNumber}</p>
                      <p>AI Confidence: {t.aiConfidence}</p>
                  
                      <button
                        onClick={() => updateStatus(t._id, "in-process")}
                        style={{ marginTop: "10px" }}
                      >
                        Mark as In-Process
                      </button>
                    </div>
                  ))
                  
            )}
          </>
        )}

        {activeTab === "inProcess" && (
          <>
            <h2>Tickets In-Process</h2>
            {tickets.inProcess.length === 0 ? (
              <p>No in-process tickets</p>
            ) : (
              tickets.inProcess.map(t => (
                <div key={t._id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                  <p><b>{t.title}</b></p>
                  <p>{t.description}</p>
                  <p>Room: {t.roomNumber}</p>
                  
                  <button
                    onClick={() => updateStatus(t._id, "resolved")}
                    style={{ marginTop: "10px" }}
                  >
                    Mark as Resolved
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "resolved" && (
          <>
            <h2>Resolved Tickets</h2>
            {tickets.resolved.length === 0 ? (
              <p>No resolved tickets</p>
            ) : (
              tickets.resolved.map(t => (
                <div key={t._id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
                  <p><b>{t.title}</b></p>
                  <p>{t.description}</p>
                  <p>Room: {t.roomNumber}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
