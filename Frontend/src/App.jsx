import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Books from "./pages/Books";
import Cart from "./pages/Cart";
import History from "./pages/History";
import Profile from "./pages/Profile";
import AdminBooks from "./pages/AdminBooks";
import AdminHistory from "./pages/AdminHistory";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

// ======================= NAVBAR =======================
function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#222",
        padding: "10px 20px",
      }}
    >
      <div>
        {/* ----------- GUEST / USER LINKS ----------- */}
        {!user && (
          <>
            <Link to="/books" style={linkStyle}>
              Books
            </Link>
          </>
        )}

        {user?.role === "user" && (
          <>
            <Link to="/books" style={linkStyle}>
              Books
            </Link>
            <Link to="/cart" style={linkStyle}>
              Cart
            </Link>
            <Link to="/history" style={linkStyle}>
              History
            </Link>
          </>
        )}

        {/* ----------- ADMIN LINKS ----------- */}
        {user?.role === "admin" && (
          <>
            <Link to="/admin/dashboard" style={linkStyle}>
              Dashboard
            </Link>
            <Link to="/admin" style={linkStyle}>
              Manage Books
            </Link>
            <Link to="/admin/history" style={linkStyle}>
              Transactions
            </Link>
          </>
        )}

        {/* ----------- COMMON PROFILE LINK ----------- */}
        {user && (
          <Link to="/profile" style={linkStyle}>
            Profile
          </Link>
        )}
      </div>

      {/* ----------- AUTH BUTTONS ----------- */}
      <div>
        {user ? (
          <>
            <span style={{ color: "#fff", marginRight: 12 }}>
              Hi, {user.name}
            </span>
            <button onClick={logout} style={logoutBtn}>
              Logout
            </button>
          </>
        ) : (
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
    </nav>
  );
}

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  marginRight: "15px",
  fontSize: "15px",
};

const logoutBtn = {
  background: "#dc3545",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  cursor: "pointer",
  borderRadius: "4px",
};

// ======================= PROTECTED ROUTE =======================
function ProtectedRoute({ element, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/books" />;

  return element;
}

// ======================= ROUTES =======================
function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/books" />} />

      {/* Public / User Books */}
      <Route path="/books" element={<Books />} />

      {/* USER ROUTES */}
      <Route
        path="/cart"
        element={<ProtectedRoute allowedRoles={["user"]} element={<Cart />} />}
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={["user"]} element={<History />} />
        }
      />
      <Route
        path="/profile"
        element={<ProtectedRoute element={<Profile />} />}
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["admin"]}
            element={<AdminDashboard />}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]} element={<AdminBooks />} />
        }
      />
      <Route
        path="/admin/history"
        element={
          <ProtectedRoute
            allowedRoles={["admin"]}
            element={<AdminHistory />}
          />
        }
      />

      {/* AUTH ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/books" />} />
    </Routes>
  );
}

// ======================= APP WRAPPER =======================
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div style={{ padding: "20px" }}>
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}
