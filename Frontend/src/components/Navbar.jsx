import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navStyle = {
    padding: "10px 20px",
    background: "#f4f4f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  };

  const linkStyle = {
    marginRight: "15px",
    textDecoration: "none",
    color: "#333",
    fontWeight: "500",
  };

  return (
    <nav style={navStyle}>
      <div>
        <Link to="/" style={linkStyle}>
          Home
        </Link>
        <Link to="/books" style={linkStyle}>
          Books
        </Link>

        {/* User Navigation */}
        {user && user.role === "user" && (
          <>
            <Link to="/cart" style={linkStyle}>
              Cart
            </Link>
            <Link to="/history" style={linkStyle}>
              My History
            </Link>
          </>
        )}

        {/* Admin Navigation */}
        {user && user.role === "admin" && (
          <>
            <Link to="/admin" style={linkStyle}>
              Manage Books
            </Link>
            <Link to="/admin-history" style={linkStyle}>
              Admin History
            </Link>
          </>
        )}

        {/* Guest Navigation */}
        {!user && (
          <>
            <Link to="/login" style={linkStyle}>
              Login
            </Link>
            <Link to="/register" style={linkStyle}>
              Register
            </Link>
          </>
        )}
      </div>

      {/* Right Side — User Info */}
      {user && (
        <div>
          <span style={{ marginRight: "15px", fontWeight: "500" }}>
            Welcome, {user.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              background: "#ff4b4b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
