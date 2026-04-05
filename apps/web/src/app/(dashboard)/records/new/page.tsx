"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = ["SALARY","FREELANCE","INVESTMENT","RENT","FOOD","TRANSPORT","HEALTHCARE","EDUCATION","ENTERTAINMENT","UTILITIES","SHOPPING","TRAVEL","OTHER"];

export default function NewRecordPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    amount: "", type: "INCOME", category: "SALARY",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (user?.role === "VIEWER") {
    return (
      <div className="page-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-text">Access Denied</div>
          <div className="empty-state-sub">You need Analyst or Admin role to create records.</div>
        </div>
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Enter a valid positive amount";
    if (!form.date) e.date = "Date is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const res = await recordsApi.create({
      amount: Number(form.amount),
      type: form.type as "INCOME" | "EXPENSE",
      category: form.category,
      date: form.date,
      description: form.description || undefined,
    });
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => router.push("/records"), 1200);
    } else {
      setErrors({ submit: res.message });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>← Back</button>
          <div>
            <h1 className="page-title">Add Financial Record</h1>
            <p className="page-subtitle">Create a new income or expense entry</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 560 }}>
          <div className="card">
            {success && (
              <div style={{ background: "var(--income-subtle)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-sm)", color: "var(--income)", padding: "12px 16px", marginBottom: 20, fontSize: 14 }}>
                ✅ Record created successfully! Redirecting...
              </div>
            )}

            {errors.submit && (
              <div className="auth-error" style={{ marginBottom: 16 }}>{errors.submit}</div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Type Toggle */}
              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["INCOME", "EXPENSE"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`btn ${form.type === t ? (t === "INCOME" ? "btn-primary" : "btn-danger") : "btn-secondary"}`}
                      style={{ flex: 1 }}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                    >
                      {t === "INCOME" ? "↑ Income" : "↓ Expense"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="amount">Amount (₹) *</label>
                  <input
                    id="amount"
                    className={`form-input ${errors.amount ? "border-expense" : ""}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                  {errors.amount && <div className="form-error">{errors.amount}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="date">Date *</label>
                  <input
                    id="date"
                    className="form-input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                  {errors.date && <div className="form-error">{errors.date}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Category *</label>
                <select
                  id="category"
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  placeholder="Optional note about this transaction..."
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? "Creating..." : "Create Record"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
