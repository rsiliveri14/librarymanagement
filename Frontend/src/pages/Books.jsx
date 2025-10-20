import React, { useEffect, useState } from "react";
import API from "../api";
import { useAuth } from "../AuthContext";

export default function Books() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const headers = token ? { Authorization: token } : {};

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await API.get("/books", {
        params: { q: query || "", category: category || "" },
      });
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/books/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  // ---------------- USER ACTIONS ----------------
  const borrowBook = async (bookId) => {
    try {
      await API.post(`/cart/add/${bookId}`, {}, { headers });
      alert("Book borrowed successfully!");
      fetchBooks();
    } catch (err) {
      console.error("Error borrowing book:", err);
      alert("Could not borrow book. It might be out of stock.");
    }
  };

  // ---------------- ADMIN ACTIONS ----------------
  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await API.delete(`/books/${bookId}`, { headers });
      fetchBooks();
    } catch (err) {
      alert("Failed to delete book.");
      console.error(err);
    }
  };

  const handleEdit = async (bookId) => {
    const title = prompt("Enter new title:");
    const author = prompt("Enter new author:");
    const quantity = prompt("Enter new quantity:");
    const category = prompt("Enter new category:");
    if (!title || !author || quantity === null) return;

    try {
      await API.put(
        `/books/${bookId}`,
        { title, author, quantity: parseInt(quantity), category },
        { headers }
      );
      fetchBooks();
    } catch (err) {
      alert("Failed to update book.");
      console.error(err);
    }
  };

  // ---------------- UI ----------------
  if (loading) return <p>Loading books...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Available Books</h2>

      {/* Search & Filter */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Search by title or author"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "8px",
            marginRight: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "200px",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginRight: "10px",
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          onClick={fetchBooks}
          style={{
            padding: "8px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {/* Books Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {books.map((book) => (
          <div
            key={book.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              background: "#fff",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginBottom: "8px" }}>{book.title}</h3>
            <p style={{ margin: "5px 0" }}>
              <strong>Author:</strong> {book.author}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>Category:</strong> {book.category || "—"}
            </p>
            <p style={{ margin: "5px 0" }}>
              <strong>Available:</strong>{" "}
              <span
                style={{
                  color: book.quantity > 0 ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {book.quantity > 0 ? book.quantity : "Out of Stock"}
              </span>
            </p>

            {/* USER ACTION */}
            {user?.role === "user" && book.quantity > 0 && (
              <button
                onClick={() => borrowBook(book.id)}
                style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Borrow Book
              </button>
            )}

            {/* ADMIN ACTIONS */}
            {user?.role === "admin" && (
              <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => handleEdit(book.id)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {books.length === 0 && (
        <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
          No books found.
        </p>
      )}
    </div>
  );
}
