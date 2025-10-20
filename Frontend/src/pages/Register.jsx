import React, { useState } from "react";
import API from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/register", form);
      setMsg("Registration successful! You can now login.");
      setForm({ name: "", email: "", password: "" });
    } catch {
      setMsg("Error registering user. Try another email.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "300px", margin: "50px auto" }}>
      <h2>Register</h2>
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button type="submit">Register</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
