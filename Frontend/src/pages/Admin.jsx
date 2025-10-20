// src/pages/Admin.jsx
import React, { useEffect, useState } from "react";
import API from "../api";

export default function Admin() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ title: "", author: "", quantity: 1 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", author: "", quantity: 1 });
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await API.get("/books");
    setBooks(res.data);
  }

  useEffect(() => {
    load();
  }, []);
  async function addToCart(book) {
    try {
      await API.post("/cart/add", { book_id: book.id });
      setMessage(`${book.title} added to cart!`);
      await fetchBooks(); // refresh quantities
    } catch (e) {
      setMessage("Could not add to cart.");
    }
  }
  
  async function addBook(e) {
    e.preventDefault();
    try {
      await API.post("/books", {
        title: form.title.trim(),
        author: form.author.trim(),
        quantity: Number(form.quantity) || 0,
      });
      setForm({ title: "", author: "", quantity: 1 });
      setMsg("Book added.");
      await load();
    } catch (err) {
      console.error(err);
      setMsg("Error adding book. Are you logged in as admin?");
    }
  }

  function beginEdit(b) {
    setEditingId(b.id);
    setEditForm({ title: b.title, author: b.author, quantity: b.quantity });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ title: "", author: "", quantity: 1 });
  }

  async function saveEdit(id) {
    try {
      await API.put(`/books/${id}`, {
        title: editForm.title.trim(),
        author: editForm.author.trim(),
        quantity: Number(editForm.quantity) || 0,
      });
      setMsg("Book updated.");
      setEditingId(null);
      await load();
    } catch (err) {
      console.error(err);
      setMsg("Error updating book.");
    }
  }

  async function deleteBook(id) {
    if (!confirm("Delete this book?")) return;
    try {
      await API.delete(`/books/${id}`);
      setMsg("Book deleted.");
      await load();
    } catch (err) {
      console.error(err);
      setMsg("Error deleting book.");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "20px auto" }}>
      <h2>Admin — Manage Books</h2>
      {msg && <p style={{ color: "#444" }}>{msg}</p>}

      <form onSubmit={addBook} style={{ marginBottom: 20 }}>
        <h4>Add new book</h4>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Author"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          required
          style={{ marginLeft: 8 }}
        />
        <input
          type="number"
          min="0"
          placeholder="Qty"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          style={{ width: 90, marginLeft: 8 }}
          required
        />
        <button type="submit" style={{ marginLeft: 8 }}>
          Add
        </button>
      </form>

      <h4>Books</h4>
      <ul>
        {books.map((b) => (
          <li key={b.id} style={{ marginBottom: 8 }}>
            {editingId === b.id ? (
              <>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <input
                  value={editForm.author}
                  onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                  style={{ marginLeft: 8 }}
                />
                <input
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  style={{ width: 90, marginLeft: 8 }}
                />
                <button onClick={() => saveEdit(b.id)} style={{ marginLeft: 8 }}>
                  Save
                </button>
                <button onClick={cancelEdit} style={{ marginLeft: 8 }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <strong>{b.title}</strong> by {b.author} — {b.quantity} left
                <button onClick={() => beginEdit(b)} style={{ marginLeft: 8 }}>
                  Edit
                </button>
                <button onClick={() => deleteBook(b.id)} style={{ marginLeft: 8 }}>
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
