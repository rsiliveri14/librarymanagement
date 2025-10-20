import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.2rem", marginBottom: "10px", color: "#333" }}>
        📚 Welcome to the Library App
      </h1>

      {!user ? (
        <>
          <p style={{ fontSize: "1.1rem", color: "#555", maxWidth: "600px" }}>
            Discover, borrow, and track your favorite books effortlessly.
            Sign up to start exploring our collection.
          </p>
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => navigate("/login")}
              style={buttonStyle("#007bff")}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              style={buttonStyle("#28a745")}
            >
              Register
            </button>
          </div>
        </>
      ) : user.role === "admin" ? (
        <>
          <p style={{ fontSize: "1.1rem", color: "#555" }}>
            Hello, <b>{user.name}</b> 👋  
            <br /> Manage the library inventory and track all user activity.
          </p>
          <button
            onClick={() => navigate("/admin")}
            style={buttonStyle("#007bff")}
          >
            Go to Admin Dashboard
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: "1.1rem", color: "#555" }}>
            Hello, <b>{user.name}</b> 👋  
            <br /> Explore available books and manage your cart & history.
          </p>
          <button
            onClick={() => navigate("/books")}
            style={buttonStyle("#007bff")}
          >
            Browse Books
          </button>
        </>
      )}
    </div>
  );
}

// ---- Helper for consistent button styles ----
const buttonStyle = (bgColor) => ({
  padding: "10px 20px",
  margin: "0 10px",
  border: "none",
  borderRadius: "6px",
  backgroundColor: bgColor,
  color: "white",
  cursor: "pointer",
  fontSize: "1rem",
  transition: "background 0.3s",
});
