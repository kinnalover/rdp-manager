import React, { useEffect, useState } from "react";

function App() {
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState({ ip: "", username: "", password: "" });
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    const res = await fetch("http://localhost:8000/connections");
    setConnections(await res.json());
  }

  async function saveConnection(e) {
    e.preventDefault();
    if (editingIndex !== null) {
      await fetch(`http://localhost:8000/connections/${connections[editingIndex].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("http://localhost:8000/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ ip: "", username: "", password: "" });
    setEditingIndex(null);
    fetchConnections();
  }

  function editConnection(idx) {
    setEditingIndex(idx);
    setForm({ ...connections[idx] });
  }

  async function deleteConnection(idx) {
    await fetch(`http://localhost:8000/connections/${connections[idx].id}`, { method: "DELETE" });
    fetchConnections();
  }

  async function connect(idx) {
    await fetch(`http://localhost:8000/connections/${connections[idx].id}/connect`, { method: "POST" });
  }

  return (
    <main style={{ maxWidth: 500, margin: "auto", fontFamily: "sans-serif" }}>
      <h1>RDP Manager</h1>
      <form onSubmit={saveConnection} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="IP Address"
          value={form.ip}
          required
          onChange={e => setForm({ ...form, ip: e.target.value })}
        />
        <input
          placeholder="Username"
          value={form.username}
          required
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          required
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">{editingIndex !== null ? "Update" : "Add"} Connection</button>
        {editingIndex !== null && (
          <button
            type="button"
            onClick={() => {
              setForm({ ip: "", username: "", password: "" });
              setEditingIndex(null);
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {connections.map((conn, idx) => (
          <li key={conn.id} style={{ marginBottom: 8 }}>
            <b>{conn.ip}</b> ({conn.username})
            <button onClick={() => connect(idx)}>Connect</button>
            <button onClick={() => editConnection(idx)}>Edit</button>
            <button onClick={() => deleteConnection(idx)}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
