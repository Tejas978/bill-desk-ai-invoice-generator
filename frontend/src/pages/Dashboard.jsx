import React, { useEffect, useMemo, useState, useCallback } from "react";
import StatusBadge from "../components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "https://bill-desk-ai-invoice-generator.onrender.com";

/* ─── helpers ─── */
function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string") return { name: raw, email: "", address: "", phone: "" };
  if (typeof raw === "object") {
    return {
      name: raw.name ?? raw.company ?? raw.client ?? "",
      email: raw.email ?? raw.emailAddress ?? "",
      address: raw.address ?? "",
      phone: raw.phone ?? raw.contact ?? "",
    };
  }
  return { name: "", email: "", address: "", phone: "" };
}

function currencyFmt(amount = 0, currency = "INR") {
  try {
    const n = Number(amount || 0);
    if (currency === "INR")
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

const HARD_RATES = { USD_TO_INR: 83 };
function convertToINR(amount = 0, currency = "INR") {
  const n = Number(amount || 0);
  const curr = String(currency || "INR").trim().toUpperCase();
  if (curr === "INR") return n;
  if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
  return n;
}

/* ─── icons ─── */
const EyeIcon = () => (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const FileTextIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const PlusIcon = () => (
  <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14m-7-7h14" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14m-7-7l7 7-7 7" />
  </svg>
);
const TrendingUpIcon = () => (
  <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);
const TrendingDownIcon = () => (
  <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 18l-9.5-9.5-5 5L1 6" />
    <path d="M17 18h6v-6" />
  </svg>
);
const BusinessIcon = () => (
  <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m0 4h4" />
  </svg>
);
const DollarIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const ClockIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const InvoicesIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

/* ─── KPI Card ─── */
function KpiCard({ title, value, hint, icon, trend }) {
  const isPositive = trend >= 0;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.6)",
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.1)",
        backdropFilter: "blur(10px)",
        padding: "28px 28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 4,
            background: "rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#000",
          }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 4,
              background: isPositive ? "rgba(0,0,0,0.04)" : "rgba(220,38,38,0.06)",
              border: `1px solid ${isPositive ? "rgba(0,0,0,0.08)" : "rgba(220,38,38,0.15)"}`,
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 10, fontWeight: 700,
              color: isPositive ? "#000" : "#dc2626",
              letterSpacing: "0.5px",
            }}
          >
            {isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            {isPositive ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "#000", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 6 }}>
          {value}
        </div>
        <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#666" }}>
          {title}
        </div>
        {hint && (
          <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, color: "#999", marginTop: 4, letterSpacing: "0.3px" }}>
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function Dashboard() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      let token = await getToken({ template: "default" }).catch(() => null);
      if (!token) token = await getToken({ forceRefresh: true }).catch(() => null);
      return token;
    } catch { return null; }
  }, [getToken]);

  const [storedInvoices, setStoredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/invoice`, { method: "GET", headers });
      const json = await res.json().catch(() => null);
      if (res.status === 401) { setError("Unauthorized. Please sign in."); setStoredInvoices([]); return; }
      if (!res.ok) throw new Error(json?.message || `Failed to fetch (${res.status})`);
      const raw = json?.data || [];
      const mapped = (Array.isArray(raw) ? raw : []).map((inv) => ({
        ...inv,
        id: inv.invoiceNumber || inv._id || String(inv._id || ""),
        client: inv.client ?? {},
        amount: Number(inv.total ?? inv.amount ?? 0),
        currency: (inv.currency || "INR").toUpperCase(),
        status: typeof inv.status === "string" ? capitalize(inv.status) : inv.status || "Draft",
      }));
      setStoredInvoices(mapped);
    } catch (err) {
      setError(err?.message || "Failed to load invoices");
      setStoredInvoices([]);
    } finally { setLoading(false); }
  }, [obtainToken]);

  const fetchBusinessProfile = useCallback(async () => {
    try {
      const token = await obtainToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/businessProfile/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      if (json?.data) setBusinessProfile(json.data);
    } catch {}
  }, [obtainToken]);

  useEffect(() => {
    fetchInvoices();
    fetchBusinessProfile();
    function onStorage(e) { if (e.key === "invoices_v1") fetchInvoices(); }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchInvoices, fetchBusinessProfile, isSignedIn]);

  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0, totalUnpaid = 0, paidCount = 0, unpaidCount = 0;
    storedInvoices.forEach((inv) => {
      const amtInINR = convertToINR(inv.amount, inv.currency);
      if (inv.status === "Paid") { totalPaid += amtInINR; paidCount++; }
      if (inv.status === "Unpaid" || inv.status === "Overdue") { totalUnpaid += amtInINR; unpaidCount++; }
    });
    const totalAmount = totalPaid + totalUnpaid;
    return {
      totalInvoices, totalPaid, totalUnpaid, paidCount, unpaidCount,
      paidPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      unpaidPercentage: totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0,
    };
  }, [storedInvoices]);

  const recent = useMemo(() =>
    storedInvoices.slice()
      .sort((a, b) => (Date.parse(b.issueDate || 0) || 0) - (Date.parse(a.issueDate || 0) || 0))
      .slice(0, 5),
    [storedInvoices]
  );

  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object") return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };
  const getClientInitial = (inv) => {
    const n = getClientName(inv);
    return n ? n.charAt(0).toUpperCase() : "C";
  };

  function openInvoice(invRow) {
    navigate(`/app/invoices/${invRow.id}`, { state: { invoice: invRow } });
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.6)",
    borderRadius: 4,
    border: "1px solid rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
  };
  const cardHeaderStyle = {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  };
  const cardIconBoxStyle = {
    width: 40, height: 40, borderRadius: 4,
    background: "rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#000", flexShrink: 0,
  };
  const cardTitleStyle = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 13, fontWeight: 700, letterSpacing: "1px",
    textTransform: "uppercase", color: "#000", margin: 0,
  };
  const thStyle = {
    padding: "12px 20px", textAlign: "left",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
    textTransform: "uppercase", color: "#666",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(0,0,0,0.02)", whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "14px 20px", fontSize: 13, color: "#000",
    verticalAlign: "middle", borderBottom: "1px solid rgba(0,0,0,0.05)",
  };

  const quickActions = [
    { label: "Create Invoice", icon: <PlusIcon />, onClick: () => navigate("/app/create-invoice"), primary: true },
    { label: "View All Invoices", icon: <FileTextIcon />, onClick: () => navigate("/app/invoices"), primary: false },
    { label: "Business Profile", icon: <BusinessIcon />, onClick: () => navigate("/app/business"), primary: false },
  ];

  return (
    <>
      <style>{`
        @keyframes gridMove {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, 50px); }
        }
        .dash-row-hover { background: rgba(255,255,255,0.85) !important; cursor: pointer; }
        .dash-view-btn:hover { background: #000 !important; color: #fff !important; }
        .dash-action-hover { background: rgba(0,0,0,0.04) !important; }

        /* ── Dashboard layout ── */

        .dash-wrapper {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(to bottom, #f5f3ed 0%, #ebe8e0 50%, #f5f3ed 100%);
          padding: 40px 24px;
          overflow: hidden;
        }

        .dash-inner {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          z-index: 2;
        }

        .dash-header {
          margin-bottom: 48px;
        }

        /* KPI grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        /* Main 2-col layout */
        .dash-main-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          align-items: start;
        }

        .dash-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .dash-main-grid {
            grid-template-columns: 1fr;
          }
          .dash-sidebar {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .dash-wrapper {
            padding: 24px 16px;
          }
          .dash-header {
            margin-bottom: 28px;
          }
          .kpi-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }
          .dash-main-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .dash-sidebar {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .quick-actions-list {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
          .quick-actions-list > button {
            width: 100% !important;
            min-width: unset !important;
          }
          .col-due        { display: none; }
          .col-actions-th { display: none; }
          .col-actions-td { display: none; }
        }

        /* ── Very small ── */
        @media (max-width: 480px) {
          .col-status { display: none; }
        }
      `}</style>

      <div className="dash-wrapper">
        {/* Animated grid background */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, opacity: 0.3 }}>
          <svg style={{ width: "100%", height: "100%", opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dash-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dash-grid)">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="50 50" dur="20s" repeatCount="indefinite" />
            </rect>
          </svg>
        </div>

        <div className="dash-inner">

          {/* ── Header ── */}
          <div className="dash-header">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", backgroundColor: "#f4d9c6", borderRadius: 4, marginBottom: 20, fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <span style={{ color: "#000" }}>▸</span>
              <span style={{ color: "#000" }}>DASHBOARD OVERVIEW</span>
              <span style={{ color: "#000" }}>◂</span>
            </div>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-2px", color: "#000", textTransform: "uppercase", margin: 0 }}>
              {businessProfile?.businessName ? `${businessProfile.businessName}` : "Your Dashboard"}
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#666", marginTop: 10, fontFamily: "'Courier New', Courier, monospace" }}>
              Track your invoicing performance and business insights
            </p>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div style={{ padding: "14px 20px", background: "rgba(254,242,242,0.8)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, backdropFilter: "blur(10px)", fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#dc2626", letterSpacing: "0.3px" }}>
              <span>⚠ {error.toUpperCase()}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={fetchInvoices} style={{ padding: "6px 14px", background: "transparent", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, color: "#dc2626", letterSpacing: "0.5px", textTransform: "uppercase" }}>RETRY</button>
                {String(error).toLowerCase().includes("unauthorized") && (
                  <button onClick={() => navigate("/login")} style={{ padding: "6px 14px", background: "#dc2626", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.5px", textTransform: "uppercase" }}>SIGN IN</button>
                )}
              </div>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="kpi-grid">
            <KpiCard title="Total Invoices" value={kpis.totalInvoices} hint="Active invoices" icon={<InvoicesIcon />} trend={8.5} />
            <KpiCard title="Total Paid" value={currencyFmt(kpis.totalPaid, "INR")} hint="Received amount (INR)" icon={<DollarIcon />} trend={12.2} />
            <KpiCard title="Total Unpaid" value={currencyFmt(kpis.totalUnpaid, "INR")} hint="Outstanding balance (INR)" icon={<ClockIcon />} trend={-3.1} />
          </div>

          {/* ── Main Grid ── */}
          <div className="dash-main-grid">

            {/* ── Sidebar ── */}
            <div className="dash-sidebar">

              {/* Quick Stats */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={cardIconBoxStyle}>
                      <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <h2 style={cardTitleStyle}>Quick Stats</h2>
                  </div>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { label: "Paid Rate", value: kpis.totalInvoices > 0 ? `${((kpis.paidCount / kpis.totalInvoices) * 100).toFixed(1)}%` : "0%" },
                    { label: "Avg. Invoice", value: currencyFmt(kpis.totalInvoices > 0 ? (kpis.totalPaid + kpis.totalUnpaid) / kpis.totalInvoices : 0, "INR") },
                    { label: "Collection Eff.", value: `${kpis.paidPercentage.toFixed(1)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#666", letterSpacing: "0.3px", textTransform: "uppercase", fontWeight: 700 }}>{label}</span>
                      <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13, fontWeight: 700, color: "#000" }}>{value}</span>
                    </div>
                  ))}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#666" }}>Paid vs Unpaid</span>
                      <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, color: "#999" }}>{kpis.paidPercentage.toFixed(0)}% collected</span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${kpis.paidPercentage}%`, height: "100%", background: "#000", borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={cardIconBoxStyle}>
                      <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                      </svg>
                    </div>
                    <h2 style={cardTitleStyle}>Quick Actions</h2>
                  </div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <div className="quick-actions-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {quickActions.map(({ label, icon, onClick, primary }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 16px",
                          background: primary ? "#000" : hoveredAction === label ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.5)",
                          border: primary ? "none" : "1px solid rgba(0,0,0,0.1)",
                          borderRadius: 4, cursor: "pointer", textAlign: "left",
                          width: "100%", transition: "all 0.2s ease",
                          color: primary ? "#fff" : "#000",
                        }}
                        onMouseEnter={(e) => {
                          setHoveredAction(label);
                          if (primary) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"; }
                        }}
                        onMouseLeave={(e) => {
                          setHoveredAction(null);
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 4, background: primary ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {icon}
                        </div>
                        <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Recent Invoices Table ── */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={cardIconBoxStyle}><FileTextIcon /></div>
                  <div>
                    <h2 style={cardTitleStyle}>Recent Invoices</h2>
                    <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, color: "#888", marginTop: 3, letterSpacing: "0.3px" }}>
                      Latest 5 invoices from your account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/app/invoices")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "transparent", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#000", transition: "all 0.2s ease", flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#000"; }}
                >
                  View All <ArrowRightIcon />
                </button>
              </div>

              {loading && (
                <div style={{ padding: 48, textAlign: "center", fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  ◌ Loading invoices…
                </div>
              )}

              {!loading && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Client & ID</th>
                        <th style={thStyle}>Amount</th>
                        <th style={{ ...thStyle }} className="col-status">Status</th>
                        <th style={thStyle} className="col-due">Due Date</th>
                        <th style={{ ...thStyle, textAlign: "right" }} className="col-actions-th">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((inv) => {
                        const clientName = getClientName(inv);
                        const clientInitial = getClientInitial(inv);
                        const isHovered = hoveredRow === inv.id;
                        return (
                          <tr
                            key={inv.id}
                            style={{ background: isHovered ? "rgba(255,255,255,0.85)" : "transparent", transition: "background 0.15s ease", cursor: "pointer" }}
                            onMouseEnter={() => setHoveredRow(inv.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            onClick={() => openInvoice(inv)}
                          >
                            <td style={tdStyle}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 4, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', Courier, monospace", fontSize: 14, fontWeight: 700, color: "#000", flexShrink: 0 }}>
                                  {clientInitial}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: "#000", fontSize: 13 }}>{clientName || inv.company || "—"}</div>
                                  <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, color: "#888", marginTop: 2, letterSpacing: "0.3px" }}>{inv.id}</div>
                                </div>
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontFamily: "'Courier New', Courier, monospace", fontWeight: 700, fontSize: 13, color: "#000" }}>
                                {currencyFmt(inv.amount, inv.currency)}
                              </span>
                            </td>
                            <td style={tdStyle} className="col-status">
                              <StatusBadge status={inv.status} size="default" showIcon />
                            </td>
                            <td style={tdStyle} className="col-due">
                              <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#666" }}>
                                {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: "right" }} className="col-actions-td">
                              <button
                                className="dash-view-btn"
                                onClick={(e) => { e.stopPropagation(); openInvoice(inv); }}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "transparent", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#000", transition: "all 0.2s ease" }}
                              >
                                <EyeIcon /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {recent.length === 0 && !loading && (
                        <tr>
                          <td colSpan="5">
                            <div style={{ padding: "60px 20px", textAlign: "center" }}>
                              <div style={{ width: 56, height: 56, borderRadius: 4, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#999" }}>
                                <FileTextIcon />
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: "#000", marginBottom: 8, textTransform: "uppercase", letterSpacing: "-0.5px" }}>No Invoices Yet</div>
                              <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#888", marginBottom: 24, letterSpacing: "0.3px" }}>Create your first invoice to get started</p>
                              <button
                                onClick={() => navigate("/app/create-invoice")}
                                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#fff" }}
                              >
                                <PlusIcon /> Create Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}