"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi, type DashboardSummary, type MonthlyTrend, type CategoryBreakdown, type RecentTransaction } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const COLORS = ["#6366f1","#10b981","#f59e0b","#f43f5e","#8b5cf6","#06b6d4","#ec4899","#84cc16","#14b8a6","#fb923c","#a855f7","#22c55e"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [recent, setRecent] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, t, c, r] = await Promise.all([
      dashboardApi.summary(),
      dashboardApi.trends(2024),
      dashboardApi.byCategory(),
      dashboardApi.recent(8),
    ]);
    if (s.data) setSummary(s.data);
    if (t.data) setTrends(t.data);
    if (c.data) setCategories(c.data);
    if (r.data) setRecent(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 300, height: 16 }} />
        </div>
        <div className="page-body">
          <div className="stat-grid">
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
          </div>
        </div>
      </div>
    );
  }

  const activeMonths = trends.filter(t => t.income > 0 || t.expense > 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name} · {new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
      </div>

      <div className="page-body">
        {/* Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card income">
            <div className="stat-icon income">💰</div>
            <div className="stat-label">Total Income</div>
            <div className="stat-value income">{fmt(summary?.totalIncome || 0)}</div>
            <div className="stat-meta">{summary?.incomeCount} transactions</div>
          </div>
          <div className="stat-card expense">
            <div className="stat-icon expense">💸</div>
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value expense">{fmt(summary?.totalExpenses || 0)}</div>
            <div className="stat-meta">{summary?.expenseCount} transactions</div>
          </div>
          <div className="stat-card balance">
            <div className="stat-icon balance">📊</div>
            <div className="stat-label">Net Balance</div>
            <div className={`stat-value ${(summary?.netBalance || 0) >= 0 ? "balance-positive" : "balance-negative"}`}>
              {fmt(summary?.netBalance || 0)}
            </div>
            <div className="stat-meta">Savings rate: {summary?.savingsRate || 0}%</div>
          </div>
          <div className="stat-card records">
            <div className="stat-icon records">📋</div>
            <div className="stat-label">Total Records</div>
            <div className="stat-value">{summary?.totalRecords || 0}</div>
            <div className="stat-meta">All time entries</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="chart-grid">
          {/* Monthly Trend */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Monthly Trends — 2024</div>
                <div className="card-subtitle">Income vs Expenses over time</div>
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeMonths} margin={{ top:10, right:10, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="monthName" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f1f5f9", fontSize: 13 }}
                    formatter={(v: number) => [fmt(v)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Pie */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">By Category</div>
                <div className="card-subtitle">Expense breakdown</div>
              </div>
            </div>
            <div className="chart-wrapper" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.filter(c => c.expense > 0).slice(0,8)}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    dataKey="expense"
                    nameKey="category"
                    paddingAngle={2}
                  >
                    {categories.slice(0,8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f1f5f9", fontSize: 12 }}
                    formatter={(v: number) => [fmt(v)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 4 }}>
              {categories.filter(c => c.expense > 0).slice(0, 6).map((c, i) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, background: COLORS[i % COLORS.length], borderRadius: "50%", display: "inline-block" }} />
                  {c.category}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bar + Recent */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Income vs Expense by Category</div>
            </div>
            <div className="chart-wrapper" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories.slice(0, 7)} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="category" tick={{ fill: "#475569", fontSize: 10 }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f1f5f9", fontSize: 12 }}
                    formatter={(v: number) => [fmt(v)]}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} opacity={0.8} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4,4,0,0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Activity</div>
              <a href="/records" className="btn btn-ghost btn-sm">View all →</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recent.map((tx) => (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: tx.type === "INCOME" ? "var(--income-subtle)" : "var(--expense-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {tx.type === "INCOME" ? "↑" : "↓"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{tx.category}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(tx.date).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</div>
                    </div>
                  </div>
                  <div className={tx.type === "INCOME" ? "amount-income" : "amount-expense"}>
                    {tx.type === "INCOME" ? "+" : "-"}{fmt(Number(tx.amount))}
                  </div>
                </div>
              ))}
              {recent.length === 0 && <div className="empty-state"><div className="empty-state-text">No recent transactions</div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
