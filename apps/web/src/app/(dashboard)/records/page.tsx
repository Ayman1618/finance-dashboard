"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { recordsApi, type Record, type Pagination } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RecordModal from "@/components/RecordModal";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const CATEGORIES = ["", "SALARY","FREELANCE","INVESTMENT","RENT","FOOD","TRANSPORT","HEALTHCARE","EDUCATION","ENTERTAINMENT","UTILITIES","SHOPPING","TRAVEL","OTHER"];

export default function RecordsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [records, setRecords] = useState<Record[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [filters, setFilters] = useState({
    page: 1, limit: 15, type: "", category: "", from: "", to: "", search: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await recordsApi.list(filters as any);
    if (res.data) {
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Soft-delete this record?")) return;
    await recordsApi.delete(id);
    load();
  };

  const canEdit = user?.role === "ANALYST" || user?.role === "ADMIN";
  const canDelete = user?.role === "ADMIN";

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Financial Records</h1>
            <p className="page-subtitle">{pagination?.total ?? 0} total entries</p>
          </div>
          {canEdit && (
            <button
              id="add-record-btn"
              className="btn btn-primary"
              onClick={() => { setEditRecord(null); setShowModal(true); }}
            >
              + Add Record
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filters-bar">
          <div className="search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              placeholder="Search description..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          <select className="filter-select" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}>
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <select className="filter-select" value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c || "All Categories"}</option>)}
          </select>
          <input type="date" className="filter-select" style={{ width: "auto" }} value={filters.from} onChange={(e) => setFilters(f => ({ ...f, from: e.target.value, page: 1 }))} />
          <input type="date" className="filter-select" style={{ width: "auto" }} value={filters.to} onChange={(e) => setFilters(f => ({ ...f, to: e.target.value, page: 1 }))} />
          {(filters.type || filters.category || filters.from || filters.to || filters.search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ page: 1, limit: 15, type: "", category: "", from: "", to: "", search: "" })}>
              Clear ✕
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Created By</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  {(canEdit || canDelete) && <th style={{ textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: "80%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-text">No records found</div>
                        <div className="empty-state-sub">Try adjusting your filters</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                        {new Date(rec.date).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })}
                      </td>
                      <td>
                        <span className={`badge badge-${rec.type.toLowerCase()}`}>{rec.type}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>{rec.category}</td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {rec.description || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{(rec as any).user?.name || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={rec.type === "INCOME" ? "amount-income" : "amount-expense"}>
                          {rec.type === "INCOME" ? "+" : "-"}{fmt(Number(rec.amount))}
                        </span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            {canEdit && (
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditRecord(rec); setShowModal(true); }}>Edit</button>
                            )}
                            {canDelete && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(rec.id)}>Delete</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ padding: "16px 24px" }}>
              <div className="pagination">
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
                </span>
                <div className="pagination-controls">
                  <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
                  <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <RecordModal
          record={editRecord}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
