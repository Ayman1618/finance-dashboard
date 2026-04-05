"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles?: Array<"VIEWER" | "ANALYST" | "ADMIN">;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: "◈", label: "Dashboard" },
  { href: "/records", icon: "≡", label: "Records" },
  { href: "/records/new", icon: "+", label: "Add Record", roles: ["ANALYST", "ADMIN"] },
  { href: "/analytics", icon: "◉", label: "Analytics", roles: ["ANALYST", "ADMIN"] },
  { href: "/users", icon: "⊕", label: "Users", roles: ["ADMIN"] },
  { href: "/audit", icon: "◎", label: "Audit Logs", roles: ["ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visible = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">💹</div>
          <div>
            <div className="logo-text">FinanceOS</div>
            <div className="logo-sub">Dashboard</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>
        {visible.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/records/new") ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="nav-item"
          style={{ width: "100%", marginTop: 4, color: "var(--expense)" }}
        >
          <span className="nav-icon">⎋</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
