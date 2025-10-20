import React, { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const headers = { Authorization: token };

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/user/profile", { headers });
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>Failed to load profile data.</p>;

  // --------------- USER VIEW ---------------
  if (user?.role === "user") {
    const stats = profile.stats || {};
    return (
      <div style={{ padding: "30px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "25px" }}>👤 My Profile</h2>

        <div style={cardContainer}>
          <div style={card}>
            <h3>Name:</h3>
            <p>{profile.user?.name}</p>
          </div>
          <div style={card}>
            <h3>Email:</h3>
            <p>{profile.user?.email}</p>
          </div>
          <div style={card}>
            <h3>Role:</h3>
            <p>{profile.user?.role}</p>
          </div>
        </div>

        <h3 style={{ marginTop: "30px" }}>📈 Reading Statistics</h3>
        <table style={statsTable}>
          <tbody>
            <tr>
              <td style={labelCell}>Total Books Borrowed:</td>
              <td style={valueCell}>{stats.checkouts || 0}</td>
            </tr>
            <tr>
              <td style={labelCell}>Books Returned:</td>
              <td style={valueCell}>{stats.returns || 0}</td>
            </tr>
            <tr>
              <td style={labelCell}>Currently Borrowed:</td>
              <td style={valueCell}>{stats.held || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // --------------- ADMIN VIEW ---------------
  if (user?.role === "admin") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>👨‍💼 Admin Profile</h2>
        <p style={{ marginTop: "10px" }}>
          Logged in as <strong>{profile.user?.name}</strong> ({profile.user?.email})
        </p>
        <p style={{ marginTop: "20px" }}>
          You can manage books and view stats from your{" "}
          <a href="/admin/dashboard" style={{ color: "#007bff" }}>
            Admin Dashboard
          </a>.
        </p>
      </div>
    );
  }

  return null;
}

// ---------- STYLES ----------
const cardContainer = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const card = {
  flex: "1 1 250px",
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  padding: "15px 20px",
};

const statsTable = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
  background: "#fff",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const labelCell = {
  padding: "10px 15px",
  fontWeight: "bold",
  borderBottom: "1px solid #eee",
  textAlign: "left",
  width: "50%",
};

const valueCell = {
  padding: "10px 15px",
  borderBottom: "1px solid #eee",
  textAlign: "center",
  width: "50%",
};
