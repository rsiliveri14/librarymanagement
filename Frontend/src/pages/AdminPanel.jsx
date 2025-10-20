import React, { useState, useEffect } from "react";
import API from "../api";

export default function AdminPanel() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ title: "", author: "", quantity: 1 });
  const token = localStorage.getItem("token");

  const fetchBooks = async () => {
    const res = await API.get("/books");
    setBooks(res.data);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addBook = async () => {
    try {
      await API.post("/books", form, { headers: { Authorization: token } });
      setForm({ title: "", author: "", quantity: 1 });
      fetchBooks();
    } catch (err) {
      alert("Error adding book. Are you logged in as admin?");
    }
  };

  const deleteBook = async (id) => {
    if (!window.confirm("Delete this book?")) return;
    await API.delete(`/books/${id}`, { headers: { Authorization: token } });
    fetchBooks();
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <div style={{ marginBottom: "20px" }}>
        <input
          name="title"
          placeholder="Book title"
          value={form.title}
          onChange={handleChange}
        />
        <input
          name="author"
          placeholder="Author"
          value={form.author}
          onChange={handleChange}
        />
        <input
          name="quantity"
          type="number"
          placeholder="Qty"
          value={form.quantity}
          onChange={handleChange}
        />
        <button onClick={addBook}>Add Book</button>
      </div>

      <table border="1" cellPadding="6" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th><th>Title</th><th>Author</th><th>Qty</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.title}</td>
              <td>{b.author}</td>
              <td>{b.quantity}</td>
              <td><button onClick={() => deleteBook(b.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
