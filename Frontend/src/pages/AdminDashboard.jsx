import React, { useEffect, useState } from "react";
import API from "../api";

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: token };

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats", { headers });
      setStats(res.data.totals);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return <p>Unable to load stats.</p>;

  const card = {
    background: "#fff",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  };

  const title = {
    fontSize: "18px",
    color: "#555",
    marginBottom: "10px",
  };

  const number = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#007bff",
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
        📊 Admin Dashboard
      </h2>

      <div style={grid}>
        <div style={card}>
          <div style={title}>👥 Total Users</div>
          <div style={number}>{stats.users}</div>
        </div>

        <div style={card}>
          <div style={title}>📚 Book Titles</div>
          <div style={number}>{stats.books}</div>
        </div>

        <div style={card}>
          <div style={title}>📦 Total Copies in Library</div>
          <div style={number}>{stats.total_copies}</div>
        </div>

        <div style={card}>
          <div style={title}>✅ Checkouts</div>
          <div style={number}>{stats.checkouts}</div>
        </div>

        <div style={card}>
          <div style={title}>↩️ Returns</div>
          <div style={number}>{stats.returns}</div>
        </div>

        <div style={card}>
          <div style={title}>📖 Currently Borrowed</div>
          <div style={number}>{stats.currently_borrowed}</div>
        </div>
      </div>
    </div>
  );
}
