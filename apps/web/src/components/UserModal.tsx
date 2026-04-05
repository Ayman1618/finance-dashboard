"use client";
import { useState } from "react";
import { usersApi, type User } from "@/lib/api";

interface Props {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}

const ROLES = ["VIEWER", "ANALYST", "ADMIN"] as const;
const STATUSES = ["ACTIVE", "INACTIVE"] as const;

export default function UserModal({ user, onClose, onSaved }: Props) {
  const isCreate = !user;
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: "VIEWER" | "ANALYST" | "ADMIN";
    status: "ACTIVE" | "INACTIVE";
  }>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "VIEWER",
    status: user?.status ?? "ACTIVE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = isCreate
      ? await usersApi.create({ name: form.name, email: form.email, password: form.password, role: form.role })
      : await usersApi.update(user!.id, { name: form.name, role: form.role, status: form.status });
    setLoading(false);
    if (res.success) onSaved();
    else setError(res.message);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isCreate ? "Create User" : "Edit User"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <form id="user-modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            {isCreate && (
              <>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" value={form.password} placeholder="Min 8 chars, uppercase, number"
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
              </>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as "VIEWER" | "ANALYST" | "ADMIN" }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {!isCreate && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="user-modal-form" type="submit" disabled={loading}>
            {loading ? "Saving..." : isCreate ? "Create User" : "Update User"}
          </button>
        </div>
      </div>
    </div>
  );
}
