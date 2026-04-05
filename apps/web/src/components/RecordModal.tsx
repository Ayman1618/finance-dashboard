"use client";
import { useState, useEffect } from "react";
import { recordsApi, type Record } from "@/lib/api";

interface Props {
  record: Record | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["SALARY","FREELANCE","INVESTMENT","RENT","FOOD","TRANSPORT","HEALTHCARE","EDUCATION","ENTERTAINMENT","UTILITIES","SHOPPING","TRAVEL","OTHER"];

const fmt = (d: string) => d?.split("T")[0] ?? "";

export default function RecordModal({ record, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    amount: record ? String(Number(record.amount)) : "",
    type: record?.type ?? "INCOME",
    category: record?.category ?? "SALARY",
    date: record ? fmt(record.date) : new Date().toISOString().split("T")[0],
    description: record?.description ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be positive"); return; }
    setLoading(true);
    const payload = {
      amount: Number(form.amount),
      type: form.type as "INCOME" | "EXPENSE",
      category: form.category,
      date: form.date,
      description: form.description || undefined,
    };
    const res = record
      ? await recordsApi.update(record.id, payload)
      : await recordsApi.create(payload);
    setLoading(false);
    if (res.success) onSaved();
    else setError(res.message);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{record ? "Edit Record" : "New Record"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <form id="record-modal-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["INCOME","EXPENSE"].map(t => (
                  <button key={t} type="button"
                    className={`btn btn-sm ${form.type === t ? (t === "INCOME" ? "btn-primary" : "btn-danger") : "btn-secondary"}`}
                    style={{ flex: 1 }}
                    onClick={() => setForm(f => ({ ...f, type: t as "INCOME" | "EXPENSE" }))}
                  >{t === "INCOME" ? "↑ Income" : "↓ Expense"}</button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" min="0.01" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Optional note..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="record-modal-form" type="submit" disabled={loading}>
            {loading ? "Saving..." : record ? "Update Record" : "Create Record"}
          </button>
        </div>
      </div>
    </div>
  );
}
