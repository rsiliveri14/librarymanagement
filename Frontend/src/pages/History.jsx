import React, { useEffect, useState } from "react";
import API from "../api";

export default function History() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: token };

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await API.get("/history", { headers });
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleReturn = async (bookID) => {
    const qty = prompt("Enter number of copies to return:");
    const quantity = parseInt(qty);

    if (!quantity || quantity <= 0) {
      alert("Invalid quantity entered.");
      return;
    }

    try {
      await API.post(`/cart/return/${bookID}`, { quantity }, { headers });
      alert("Return successful!");
      fetchHistory();
    } catch (err) {
      console.error("Return error:", err);
      alert("Error returning book(s).");
    }
  };

  if (loading) return <p>Loading history...</p>;
  if (!history.length)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h3>No borrowing history yet.</h3>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>📚 Borrowing History</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th style={th}>Title</th>
            <th style={th}>Author</th>
            <th style={th}>Quantity</th>
            <th style={th}>Type</th>
            <th style={th}>Date</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{entry.book || "Unknown"}</td>
              <td style={td}>{entry.author || "Unknown"}</td>
              <td style={{ ...td, textAlign: "center" }}>{entry.quantity || 1}</td>
              <td style={{ ...td, textTransform: "capitalize" }}>
                <span
                  style={{
                    color: entry.type === "checkout" ? "#007bff" : "#28a745",
                    fontWeight: "bold",
                  }}
                >
                  {entry.type}
                </span>
              </td>
              <td style={td}>{entry.created_at}</td>
              <td style={{ textAlign: "center" }}>
                {entry.type === "checkout" && (
                  <button
                    onClick={() => handleReturn(entry.book_id || entry.id)}
                    style={btnGreen}
                  >
                    Return
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Styles ----------
const th = { textAlign: "center", padding: "10px" };
const td = { padding: "10px" };
const btnGreen = {
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};
