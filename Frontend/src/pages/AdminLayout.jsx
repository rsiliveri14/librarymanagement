import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();

  const navLinks = [
    { path: "/admin/dashboard", label: "📊 Dashboard" },
    { path: "/admin", label: "📚 Manage Books" },
    { path: "/admin/history", label: "📜 History" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9f9f9" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          background: "#222",
          color: "white",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Admin Panel</h2>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              color: location.pathname === link.path ? "#007bff" : "white",
              textDecoration: "none",
              padding: "10px 20px",
              background:
                location.pathname === link.path ? "rgba(0,123,255,0.1)" : "transparent",
              borderLeft:
                location.pathname === link.path ? "4px solid #007bff" : "4px solid transparent",
              marginBottom: "8px",
              transition: "0.2s",
            }}
          >
            {link.label}
          </Link>
        ))}
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: "30px",
          background: "#f9f9f9",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
