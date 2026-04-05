"use client";
import { useEffect, useState, useCallback } from "react";
import { dashboardApi, type CategoryBreakdown, type Insights } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, i] = await Promise.all([
      dashboardApi.byCategory(),
      dashboardApi.insights(),
    ]);
    if (c.data) setCategories(c.data);
    if (i.data) setInsights(i.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (user?.role === "VIEWER") {
    return (
      <div className="page-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-text">Access Denied</div>
          <div className="empty-state-sub">Analytics requires Analyst or Admin role.</div>
        </div>
      </div>
    );
  }

  const radarData = categories.slice(0, 8).map(c => ({
    category: c.category.slice(0, 5),
    income: c.income / 1000,
    expense: c.expense / 1000,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Deep financial insights and category analysis</p>
      </div>

      <div className="page-body">
        {/* Insight Cards */}
        {insights && (
          <div className="stat-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card income">
              <div className="stat-icon income">🏆</div>
              <div className="stat-label">Top Expense Category</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{insights.topExpenseCategory?.category || "—"}</div>
              <div className="stat-meta">{insights.topExpenseCategory ? fmt(insights.topExpenseCategory.total) : ""}</div>
            </div>
            <div className="stat-card expense">
              <div className="stat-icon expense">⚠️</div>
              <div className="stat-label">Highest Single Expense</div>
              <div className="stat-value expense" style={{ fontSize: 20 }}>{insights.biggestExpense ? fmt(insights.biggestExpense.amount) : "—"}</div>
              <div className="stat-meta">{insights.biggestExpense?.category}</div>
            </div>
            <div className="stat-card balance">
              <div className="stat-icon balance">💎</div>
              <div className="stat-label">Biggest Income</div>
              <div className="stat-value balance-positive" style={{ fontSize: 20 }}>{insights.biggestIncome ? fmt(insights.biggestIncome.amount) : "—"}</div>
              <div className="stat-meta">{insights.biggestIncome?.category}</div>
            </div>
            <div className="stat-card records">
              <div className="stat-icon records">📅</div>
              <div className="stat-label">Avg Monthly Expense</div>
              <div className="stat-value" style={{ fontSize: 20 }}>{fmt(insights.avgMonthlyExpense)}</div>
              <div className="stat-meta">Per month average</div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Category spend bar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Expense by Category</div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories.filter(c => c.expense > 0)} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f1f5f9", fontSize: 12 }}
                    formatter={(v: number) => [fmt(v)]}
                  />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[0,4,4,0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Income vs Expense Radar</div>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Radar name="Income" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Radar name="Expense" dataKey="expense" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
                  <Tooltip
                    contentStyle={{ background: "#181c24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f1f5f9", fontSize: 12 }}
                    formatter={(v: number) => [`${v.toFixed(1)}k`]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "20px 24px 12px" }}>
            <div className="card-title">Complete Category Breakdown</div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Income</th>
                  <th style={{ textAlign: "right" }}>Expense</th>
                  <th style={{ textAlign: "right" }}>Net</th>
                  <th style={{ textAlign: "right" }}>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.category}>
                    <td style={{ fontWeight: 500 }}>{c.category}</td>
                    <td style={{ textAlign: "right" }} className="amount-income">{fmt(c.income)}</td>
                    <td style={{ textAlign: "right" }} className="amount-expense">{fmt(c.expense)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={(c.income - c.expense) >= 0 ? "amount-income" : "amount-expense"}>
                        {fmt(c.income - c.expense)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
