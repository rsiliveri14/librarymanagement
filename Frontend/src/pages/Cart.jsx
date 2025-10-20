import React, { useEffect, useState } from "react";
import API from "../api";

export default function Cart() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: token };

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart", { headers });
      setCart(res.data);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ----- Increase -----
  const increase = async (bookID) => {
    try {
      await API.post(`/cart/add/${bookID}`, {}, { headers });
      fetchCart();
    } catch (err) {
      console.error("Error increasing quantity:", err);
      alert("Book not available or out of stock.");
    }
  };

  // ----- Decrease -----
  const decrease = async (bookID) => {
    try {
      await API.post(`/cart/decrease/${bookID}`, {}, { headers });
      fetchCart();
    } catch (err) {
      console.error("Error decreasing quantity:", err);
      alert("Could not decrease quantity.");
    }
  };

  // ----- Remove -----
  const removeItem = async (bookID) => {
    if (!window.confirm("Remove this book from your cart?")) return;
    try {
      await API.delete(`/cart/delete/${bookID}`, { headers });
      fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Error removing item.");
    }
  };

  // ----- Checkout -----
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    if (!window.confirm("Proceed to checkout all books?")) return;
    try {
      await API.post("/cart/checkout", {}, { headers });
      alert("Checkout successful!");
      fetchCart();
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Checkout failed. Please try again.");
    }
  };

  if (loading) return <p>Loading cart...</p>;

  if (!cart.length)
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h3>Your cart is empty.</h3>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>🛒 My Cart</h2>

      <table style={tableStyle}>
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th style={th}>Title</th>
            <th style={th}>Author</th>
            <th style={th}>Quantity</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{item.book?.title}</td>
              <td style={td}>{item.book?.author}</td>
              <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
              <td style={{ textAlign: "center", padding: "10px" }}>
                <button
                  onClick={() => increase(item.book.id)}
                  style={btnGreen}
                >
                  +
                </button>
                <button
                  onClick={() => decrease(item.book.id)}
                  style={btnYellow}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <button
                  onClick={() => removeItem(item.book.id)}
                  style={btnRed}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={handleCheckout} style={btnBlue}>
          Checkout All
        </button>
      </div>
    </div>
  );
}

// ---------- Styles ----------
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const th = {
  textAlign: "center",
  padding: "10px",
};

const td = {
  padding: "10px",
};

const btnBase = {
  border: "none",
  borderRadius: "4px",
  padding: "6px 12px",
  cursor: "pointer",
  marginRight: "6px",
  fontWeight: 600,
};

const btnGreen = { ...btnBase, background: "#28a745", color: "white" };
const btnYellow = { ...btnBase, background: "#ffc107", color: "black" };
const btnRed = { ...btnBase, background: "#dc3545", color: "white" };
const btnBlue = {
  ...btnBase,
  background: "#007bff",
  color: "white",
  padding: "10px 18px",
  fontSize: "15px",
};
