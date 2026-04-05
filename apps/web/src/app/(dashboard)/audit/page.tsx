"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi, type AuditLog } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "var(--income)",
  UPDATE: "var(--warning)",
  DELETE: "var(--expense)",
  LOGIN: "var(--accent-light)",
  LOGOUT: "var(--text-muted)",
  REGISTER: "#8b5cf6",
};

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await dashboardApi.auditLogs(page, 30);
    if (res.data) {
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="page-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-text">Admin Only</div>
          <div className="empty-state-sub">Audit logs require Admin role.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Complete trail of all system actions · {pagination?.total ?? 0} entries</p>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j}><div className="skeleton" style={{ height: 13, borderRadius: 3, width: "60%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {new Date(log.createdAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                    </td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{log.user?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{log.user?.role}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: ACTION_COLORS[log.action] || "var(--text-primary)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{log.entity}</td>
                    <td style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {log.entityId || "—"}
                    </td>
                    <td style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ padding: "16px 24px" }}>
              <div className="pagination">
                <span className="pagination-info">Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries</span>
                <div className="pagination-controls">
                  <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
