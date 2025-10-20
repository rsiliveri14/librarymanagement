import React, { useEffect, useState } from "react";
import API from "../api";

export default function AdminHistory() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: token };

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await API.get("/admin/history", { headers });
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to load admin history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <p>Loading transaction history...</p>;
  if (!records.length)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h3>No transactions found yet.</h3>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>📋 All Transactions</h2>

      <table style={tableStyle}>
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th style={th}>User</th>
            <th style={th}>Email</th>
            <th style={th}>Book Title</th>
            <th style={th}>Author</th>
            <th style={th}>Type</th>
            <th style={th}>Quantity</th>
            <th style={th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item, index) => (
            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{item.user || "Unknown"}</td>
              <td style={td}>{item.email || "-"}</td>
              <td style={td}>{item.book || "Unknown"}</td>
              <td style={td}>{item.author || "-"}</td>
              <td
                style={{
                  ...tdCenter,
                  color: item.type === "checkout" ? "#007bff" : "#28a745",
                  fontWeight: "bold",
                }}
              >
                {item.type === "checkout" ? "Borrowed" : "Returned"}
              </td>
              <td style={tdCenter}>{item.quantity}</td>
              <td style={tdCenter}>
                {new Date(item.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- STYLES ----------
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const th = {
  textAlign: "center",
  padding: "10px",
  fontWeight: "bold",
};

const td = {
  padding: "10px",
  textAlign: "left",
};

const tdCenter = {
  ...td,
  textAlign: "center",
};
