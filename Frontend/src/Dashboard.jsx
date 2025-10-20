import { useEffect, useState } from "react";
import API from "./api";

export default function Dashboard() {
  const [txs, setTxs] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    API.get("/transactions/me").then(res => setTxs(res.data));
  }, [token]);

  if (!token) return <div>Please login to view your history.</div>;

  return (
    <div>
      <h2>My Transactions</h2>
      <ul style={{ listStyle:"none", padding:0 }}>
        {txs.map(t => (
          <li key={t.id} style={{ borderBottom:"1px solid #eee", padding:"8px 0" }}>
            <strong>{t.type.toUpperCase()}</strong> — Book #{t.book_id} — {new Date(t.created_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
