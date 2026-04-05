"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="landing-page" style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: 24,
      background: "radial-gradient(ellipse at top, #1e293b, var(--bg-main))"
    }}>
      <div className="logo-container" style={{ marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 16px"
        }}>
          ✨
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: "var(--text-primary)" }}>
          FinanceOS
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 500, lineHeight: 1.6 }}>
          Control your financial future with absolute clarity. Track, analyze, and optimize your wealth with our premium dashboard.
        </p>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <Link href="/register" className="btn btn-primary" style={{ padding: "12px 32px", fontSize: 16 }}>
          Create an Account
        </Link>
        <Link href="/login" className="btn btn-secondary" style={{ padding: "12px 32px", fontSize: 16 }}>
          Sign In
        </Link>
      </div>
      
      <div style={{ marginTop: 64, display: "flex", gap: 32, opacity: 0.5 }}>
        <div>🔒 Bank-grade Security</div>
        <div>⚡ Real-time Analytics</div>
        <div>📊 Visual Insights</div>
      </div>
    </div>
  );
}
