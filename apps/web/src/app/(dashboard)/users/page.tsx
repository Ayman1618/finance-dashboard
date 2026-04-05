"use client";
import { useEffect, useState, useCallback } from "react";
import { usersApi, type User } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import UserModal from "@/components/UserModal";

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await usersApi.list(page, 20);
    if (res.data) {
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this user?")) return;
    await usersApi.deactivate(id);
    load();
  };

  if (me?.role !== "ADMIN") {
    return (
      <div className="page-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-text">Admin Only</div>
          <div className="empty-state-sub">User management requires Admin role.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">{pagination?.total ?? 0} users registered</p>
          </div>
          <button
            id="create-user-btn"
            className="btn btn-primary"
            onClick={() => { setEditUser(null); setShowModal(true); }}
          >
            + Create User
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {[1,2,3,4,5].map(j => (
                        <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4, width: "70%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                          {u.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                    <td><span className={`badge badge-${u.status.toLowerCase()}`}>{u.status}</span></td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" })}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditUser(u); setShowModal(true); }}>Edit</button>
                        {u.id !== me?.id && u.status === "ACTIVE" && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u.id)}>Deactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ padding: "16px 24px" }}>
              <div className="pagination">
                <span className="pagination-info">Page {pagination.page} of {pagination.totalPages}</span>
                <div className="pagination-controls">
                  <button className="btn btn-secondary btn-sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn btn-secondary btn-sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
