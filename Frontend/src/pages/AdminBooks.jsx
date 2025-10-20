import React, { useEffect, useState } from "react";
import API from "../api";

export default function AdminBooks() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: token };

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: "", author: "", category: "", quantity: 0 });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");

  // Fetch books & categories
  const fetchBooks = async () => {
    try {
      const res = await API.get("/books", {
        params: { category: filterCategory || "" },
        headers,
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
      const res = await API.get("/books/categories", { headers });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "quantity" ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || form.quantity < 0) {
      alert("Please fill in all fields properly.");
      return;
    }

    try {
      if (editId) {
        await API.put(`/books/${editId}`, form, { headers });
      } else {
        await API.post("/books", form, { headers });
      }
      setForm({ title: "", author: "", category: "", quantity: 0 });
      setEditId(null);
      fetchBooks();
    } catch (err) {
      console.error("Error saving book:", err);
      alert("Error adding/updating book.");
    }
  };

  const handleEdit = (book) => {
    setEditId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      quantity: book.quantity,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await API.delete(`/books/${id}`, { headers });
      fetchBooks();
    } catch (err) {
      console.error("Error deleting book:", err);
      alert("Error deleting book.");
    }
  };

  if (loading) return <p>Loading books...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📚 Manage Books</h2>

      {/* Add/Edit Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
          background: "#f8f9fa",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <input
          name="title"
          placeholder="Book Title"
          value={form.title}
          onChange={handleChange}
          required
          style={input}
        />
        <input
          name="author"
          placeholder="Author"
          value={form.author}
          onChange={handleChange}
          required
          style={input}
        />
        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          style={input}
        />
        <input
          name="quantity"
          type="number"
          min="0"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          required
          style={{ ...input, width: "100px" }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: editId ? "#007bff" : "#28a745",
            color: "white",
            border: "none",
            padding: "8px 15px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
        >
          {editId ? "Update" : "Add"}
        </button>
      </form>

      {/* Category Filter */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "8px", fontWeight: "500" }}>Filter by Category:</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          <option value="">All</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Books Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <thead style={{ background: "#f0f0f0" }}>
          <tr>
            <th style={th}>Title</th>
            <th style={th}>Author</th>
            <th style={th}>Category</th>
            <th style={th}>Quantity</th>
            <th style={{ ...th, textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={td}>{book.title}</td>
              <td style={td}>{book.author}</td>
              <td style={td}>{book.category || "—"}</td>
              <td style={{ ...td, textAlign: "center" }}>{book.quantity}</td>
              <td style={{ ...td, textAlign: "center" }}>
                <button
                  onClick={() => handleEdit(book)}
                  style={editBtn}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  style={deleteBtn}
                >
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ======= Styles =======
const input = {
  padding: "8px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  flex: "1",
  minWidth: "150px",
};

const th = {
  textAlign: "left",
  padding: "10px",
  fontWeight: "600",
  color: "#333",
  borderBottom: "2px solid #ddd",
};

const td = {
  padding: "10px",
  color: "#444",
};

const editBtn = {
  backgroundColor: "#ffc107",
  border: "none",
  padding: "5px 10px",
  cursor: "pointer",
  borderRadius: "4px",
  marginRight: "8px",
};

const deleteBtn = {
  backgroundColor: "#dc3545",
  color: "white",
  border: "none",
  padding: "5px 10px",
  cursor: "pointer",
  borderRadius: "4px",
};
