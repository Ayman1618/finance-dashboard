const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await res.json();
  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  logout: (refreshToken: string) =>
    request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  me: () => request<User>("/api/auth/me"),
};

// ─── Users ─────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (page = 1, limit = 20) =>
    request<{ data: User[]; pagination: Pagination }>(`/api/users?page=${page}&limit=${limit}`),

  getById: (id: string) => request<User>(`/api/users/${id}`),

  create: (data: { name: string; email: string; password: string; role?: string }) =>
    request<User>("/api/users", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: { name?: string; role?: string; status?: string }) =>
    request<User>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deactivate: (id: string) =>
    request<User>(`/api/users/${id}`, { method: "DELETE" }),

  profile: () => request<User>("/api/users/profile"),
};

// ─── Records ───────────────────────────────────────────────────────────────

export const recordsApi = {
  list: (params: RecordFilters) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) query.set(k, String(v));
    });
    return request<{ data: Record[]; pagination: Pagination }>(`/api/records?${query}`);
  },

  getById: (id: string) => request<Record>(`/api/records/${id}`),

  create: (data: {
    amount: number;
    type: string;
    category: string;
    date: string;
    description?: string;
  }) => request<Record>("/api/records", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<{ amount: number; type: string; category: string; date: string; description: string }>) =>
    request<Record>(`/api/records/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<Record>(`/api/records/${id}`, { method: "DELETE" }),
};

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return request<DashboardSummary>(`/api/dashboard/summary?${q}`);
  },

  byCategory: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return request<CategoryBreakdown[]>(`/api/dashboard/by-category?${q}`);
  },

  trends: (year?: number) =>
    request<MonthlyTrend[]>(`/api/dashboard/trends${year ? `?year=${year}` : ""}`),

  recent: (limit = 10) =>
    request<RecentTransaction[]>(`/api/dashboard/recent?limit=${limit}`),

  insights: () => request<Insights>("/api/dashboard/insights"),

  auditLogs: (page = 1, limit = 50) =>
    request<{ data: AuditLog[]; pagination: Pagination }>(
      `/api/dashboard/audit-logs?page=${page}&limit=${limit}`
    ),
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: "VIEWER" | "ANALYST" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Record {
  id: string;
  amount: string | number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  description?: string;
  createdBy: string;
  user?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface RecordFilters {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalRecords: number;
  incomeCount: number;
  expenseCount: number;
  savingsRate: number;
}

export interface CategoryBreakdown {
  category: string;
  income: number;
  expense: number;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: number;
  monthName: string;
  income: number;
  expense: number;
  net: number;
}

export interface RecentTransaction {
  id: string;
  amount: string | number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  description?: string;
  user?: { id: string; name: string };
}

export interface Insights {
  topExpenseCategory: { category: string; total: number } | null;
  biggestExpense: { id: string; amount: number; category: string; date: string; description?: string } | null;
  biggestIncome: { id: string; amount: number; category: string; date: string; description?: string } | null;
  avgMonthlyExpense: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: unknown;
  ipAddress?: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}
