import React, { useMemo, useState, useEffect, useCallback } from "react";
import StatusBadge from "../components/StatusBadge";
import AiInvoiceModal from "../components/AiInvoiceModal";
import GeminiIcon from "../components/GeminiIcon";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "https://bill-desk-ai-invoice-generator.onrender.com";

/* ─── helpers ─── */
function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      const parsed = new URL(s);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        const path = parsed.pathname + (parsed.search || "") + (parsed.hash || "");
        return `${API_BASE.replace(/\/+$/, "")}${path}`;
      }
      return parsed.href;
    } catch (e) {}
  }
  return `${API_BASE.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

function normalizeInvoiceFromServer(inv = {}) {
  const id = inv.invoiceNumber || inv.id || inv._id || String(inv._id || "");
  const amount =
    inv.total ?? inv.amount ?? (inv.subtotal !== undefined ? inv.subtotal + (inv.tax ?? 0) : 0);
  const status = inv.status ?? inv.statusLabel ?? "Draft";
  const logo = resolveImageUrl(inv.logoDataUrl ?? inv.logoUrl ?? inv.logo ?? null);
  const stamp = resolveImageUrl(inv.stampDataUrl ?? inv.stampUrl ?? inv.stamp ?? null);
  const signature = resolveImageUrl(inv.signatureDataUrl ?? inv.signatureUrl ?? inv.signature ?? null);
  return { ...inv, id, amount, status, logo, stamp, signature };
}

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

function formatCurrency(amount = 0, currency = "INR") {
  try {
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    }
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
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

/* ─── icons ─── */
const SearchIcon = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
    <path d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
  </svg>
);
const SortIcon = ({ size = 13, dir = "asc" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transform: dir === "desc" ? "rotate(180deg)" : "none", display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
    <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
  </svg>
);
const FilterIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
  </svg>
);
const PlusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14m-7-7h14" />
  </svg>
);
const EyeIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ResetIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const ListIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
const DeleteIcon = () => (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const InvoiceIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

/* ─── Pagination ─── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 28px",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(255,255,255,0.3)",
      }}
    >
      <span
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 11,
          color: "#666",
          letterSpacing: "0.5px",
        }}
      >
        PAGE {page} OF {totalPages}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={{
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.15)",
            borderRadius: 4,
            cursor: page === 1 ? "not-allowed" : "pointer",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            fontWeight: 700,
            color: page === 1 ? "#bbb" : "#000",
            letterSpacing: "0.5px",
          }}
        >
          ← PREV
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            style={{
              padding: "6px 12px",
              background: p === page ? "#000" : "transparent",
              border: `1px solid ${p === page ? "#000" : "rgba(0,0,0,0.15)"}`,
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 11,
              fontWeight: 700,
              color: p === page ? "#fff" : "#000",
              letterSpacing: "0.5px",
            }}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          style={{
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.15)",
            borderRadius: 4,
            cursor: page === totalPages ? "not-allowed" : "pointer",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            fontWeight: 700,
            color: page === totalPages ? "#bbb" : "#000",
            letterSpacing: "0.5px",
          }}
        >
          NEXT →
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function InvoicesPage() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      let token = await getToken({ template: "default" }).catch(() => null);
      if (!token) token = await getToken({ forceRefresh: true }).catch(() => null);
      return token;
    } catch {
      return null;
    }
  }, [getToken]);

  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [perPage, setPerPage] = useState(6);
  const [sortBy, setSortBy] = useState({ key: "issueDate", dir: "desc" });
  const [page, setPage] = useState(1);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/invoice`, { method: "GET", headers });
      if (res.status === 401) {
        setError("Unauthorized. Please sign in.");
        setAllInvoices([]);
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || `Failed to fetch (${res.status})`);
      }
      const json = await res.json().catch(() => null);
      const raw = Array.isArray(json?.data) ? json.data : json || [];
      setAllInvoices(raw.map(normalizeInvoiceFromServer));
    } catch (err) {
      setError(err?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [obtainToken]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, isSignedIn]);

  const filtered = useMemo(() => {
    let arr = Array.isArray(allInvoices) ? allInvoices.slice() : [];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((i) => {
        const client = normalizeClient(i.client);
        return (
          (client.name && client.name.toLowerCase().includes(q)) ||
          (i.id && i.id.toLowerCase().includes(q)) ||
          String(i.email || "").toLowerCase().includes(q) ||
          String(i.company || "").toLowerCase().includes(q)
        );
      });
    }
    if (status !== "all")
      arr = arr.filter(
        (i) => (i.status || "").toString().toLowerCase() === status.toString().toLowerCase()
      );
    if (from || to) {
      arr = arr.filter((i) => {
        const d = new Date(i.issueDate || i.date || i.createdAt).setHours(0, 0, 0, 0);
        if (from && d < new Date(from).setHours(0, 0, 0, 0)) return false;
        if (to && d > new Date(to).setHours(23, 59, 59, 999)) return false;
        return true;
      });
    }
    arr.sort((a, b) => {
      const ak = a[sortBy.key],
        bk = b[sortBy.key];
      if (typeof ak === "number" && typeof bk === "number")
        return sortBy.dir === "asc" ? ak - bk : bk - ak;
      const ad = Date.parse(ak || a.issueDate || a.dueDate || "");
      const bd = Date.parse(bk || b.issueDate || b.dueDate || "");
      if (!isNaN(ad) && !isNaN(bd)) return sortBy.dir === "asc" ? ad - bd : bd - ad;
      const as = (ak || "").toString().toLowerCase(),
        bs = (bk || "").toString().toLowerCase();
      if (as < bs) return sortBy.dir === "asc" ? -1 : 1;
      if (as > bs) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [allInvoices, search, status, from, to, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const startIndex = (page - 1) * perPage;
  const pageData = filtered.slice(startIndex, startIndex + perPage);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  function handleSort(key) {
    setSortBy((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function openInvoice(inv) {
    const found = allInvoices.find((x) => x && x.id === inv.id) || inv;
    navigate(`/app/invoices/${inv.id}/preview`, { state: { invoice: found } });
  }

  async function handleDeleteInvoice(inv) {
    if (!inv?.id) return;
    if (!confirm(`Delete invoice ${inv.id}? This cannot be undone.`)) return;
    try {
      const token = await obtainToken();
      if (!token) {
        alert("Delete requires authentication.");
        navigate("/login");
        return;
      }
      const res = await fetch(`${API_BASE}/api/invoice/${encodeURIComponent(inv.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        alert("Unauthorized.");
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || `Delete failed (${res.status})`);
      }
      await fetchInvoices();
      alert("Invoice deleted.");
    } catch (err) {
      alert(err?.message || "Failed to delete invoice.");
    }
  }

  async function handleGenerateFromAI(rawText) {
  setAiLoading(true);

  try {
    if (!API_BASE) throw new Error("API base URL missing");

    /* 🔐 Get auth token */
    const token = await obtainToken();
    if (!token) throw new Error("Authentication required");

    /* 🤖 Call AI endpoint */
    const aiRes = await fetch(`${API_BASE}/api/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: rawText }),
    });

    const bodyText = await aiRes.text().catch(() => null);
    // console.log("AI RAW RESPONSE:", bodyText);

    let bodyJson = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch (err) {
      console.error("Invalid JSON from AI backend:", bodyText);
      throw new Error("Backend returned invalid JSON");
    }

    /* ❌ Handle HTTP errors */
    if (!aiRes.ok) {
      const msg =
        bodyJson?.message ||
        bodyJson?.detail ||
        bodyText ||
        `AI generate failed (${aiRes.status})`;

      if (
        aiRes.status === 429 ||
        /quota|exhausted|resource_exhausted/i.test(msg)
      ) {
        throw new Error(`AI provider quota/exhausted: ${msg}`);
      }

      throw new Error(msg);
    }

    /* ❌ Validate success flag */
    if (!bodyJson?.success) {
      console.error("AI failure response:", bodyJson);
      throw new Error(bodyJson?.message || "AI generation failed");
    }

    /* ❌ Validate data */
    if (!bodyJson?.data || typeof bodyJson.data !== "object") {
      console.error("Missing invoice data:", bodyJson);
      throw new Error("AI returned no invoice data.");
    }

   const raw = bodyJson.data;
const today = new Date().toISOString().split("T")[0];

const aiInvoice = {
  invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,

  issueDate: raw.invoice_date || raw.date || today,

  dueDate: raw.due_date || raw.invoice_date || today,  // ✅ fixed

  client: {
    name:    raw.client?.name    || raw.client_details?.name    || raw.clientDetails?.name    || "",
    email:   raw.client?.email   || raw.client_details?.email   || raw.clientDetails?.email   || "",
    phone:   raw.client?.phone   || raw.client_details?.phone   || raw.clientDetails?.phone   || "",
    address: raw.client?.address || raw.client_details?.address || raw.clientDetails?.address || "",
  },

  currency: raw.currency || "INR",

  taxPercent: raw.tax_rate ?? raw.taxRate ?? 18,  // ✅ fixed

  status: (() => {
    const s = raw.payment_status || raw.paymentStatus || "";
    const normalized = String(s).toLowerCase().trim();
    if (normalized.includes("paid"))    return "Paid";
    if (normalized.includes("overdue")) return "Overdue";
    if (normalized.includes("draft"))   return "Draft";
    return "Unpaid";
  })(),

  items: (raw.items || []).map((item, index) => ({
    id:          `item-${index + 1}`,
    description: item.description || "",
    qty:         Number(item.quantity ?? item.qty ?? 1),       // ✅ fixed
    unitPrice:   Number(item.unit_price ?? item.unitPrice ?? 0), // ✅ fixed
  })),
};
    
    /* 🧾 Create invoice in DB */
    const createRes = await fetch(`${API_BASE}/api/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(aiInvoice),
    });

    const createText = await createRes.text().catch(() => null);
    let createJson = null;
    try {
      createJson = createText ? JSON.parse(createText) : null;
    } catch {}

    if (!createRes.ok) {
      throw new Error(
        createJson?.message ||
        createJson?.detail ||
        createText ||
        `Create failed (${createRes.status})`
      );
    }

    const saved = normalizeInvoiceFromServer(
      createJson?.data || createJson
    );

    await fetchInvoices();
    setAiOpen(false);

    navigate(`/app/invoices/${saved.id}/edit`, {
      state: { invoice: saved },
    });

  } catch (err) {
    console.error("AI Generate Error:", err);
    alert(err.message || "AI generation failed");
  } finally {
    setAiLoading(false);
  }
}


  const getClientInitial = (client) => {
    const c = normalizeClient(client);
    return c.name ? c.name.charAt(0).toUpperCase() : "C";
  };

  /* shared input style — matches BusinessProfile */
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    color: "#000",
    background: "rgba(255,255,255,0.8)",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 4,
    outline: "none",
    fontFamily: "'Courier New', Courier, monospace",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 8,
  };

  /* card container — matches BusinessProfile cards */
  const cardStyle = {
    background: "rgba(255,255,255,0.6)",
    borderRadius: 4,
    border: "1px solid rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)",
    overflow: "hidden",
    marginBottom: 32,
  };

  const cardHeaderStyle = {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const cardIconBoxStyle = {
    width: 40,
    height: 40,
    borderRadius: 4,
    background: "rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0,0,0,0.08)",
    color: "#000",
    flexShrink: 0,
  };

  const cardTitleStyle = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#000",
    margin: 0,
  };

  const thStyle = {
    padding: "12px 20px",
    textAlign: "left",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "#666",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    background: "rgba(0,0,0,0.02)",
  };

  const tdStyle = {
    padding: "14px 20px",
    fontSize: 13,
    color: "#000",
    verticalAlign: "middle",
    borderBottom: "1px solid rgba(0,0,0,0.05)",
  };

  return (
    <>
      <style>{`
        @keyframes gridMove {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, 50px); }
        }
        .inv-row-hover { background: rgba(255,255,255,0.85) !important; }
        .inv-input:focus { border-color: #000 !important; }
        .inv-action-btn:hover { background: #000 !important; color: #fff !important; }
        .inv-delete-btn:hover { background: #dc2626 !important; color: #fff !important; }
        .inv-ghost-btn:hover { background: rgba(0,0,0,0.05) !important; }
        .inv-ai-btn:hover { background: #000 !important; color: #fff !important; }
      `}</style>

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background:
            "linear-gradient(to bottom, #f5f3ed 0%, #ebe8e0 50%, #f5f3ed 100%)",
          padding: "40px 24px",
          overflow: "hidden",
        }}
      >
        {/* Animated grid background — identical to BusinessProfile */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.3,
          }}
        >
          <svg
            style={{ width: "100%", height: "100%", opacity: 0.5 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="invoice-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#invoice-grid)">
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="50 50"
                dur="20s"
                repeatCount="indefinite"
              />
            </rect>
          </svg>
        </div>

        <div
          style={{
            position: "relative",
            maxWidth: 1200,
            margin: "0 auto",
            zIndex: 2,
          }}
        >
          {/* ── Header ── */}
          <div style={{ marginBottom: 48 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 20px",
                backgroundColor: "#f4d9c6",
                borderRadius: 4,
                marginBottom: 20,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.5px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ color: "#000" }}>▸</span>
              <span style={{ color: "#000" }}>INVOICE MANAGEMENT</span>
              <span style={{ color: "#000" }}>◂</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 20,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "clamp(32px, 5vw, 48px)",
                    fontWeight: 900,
                    lineHeight: 1.1,
                    letterSpacing: "-2px",
                    marginBottom: 12,
                    color: "#000",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Your Invoices
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#666",
                    marginTop: 10,
                    fontFamily: "'Courier New', Courier, monospace",
                  }}
                >
                  Search, filter, and manage your invoices with powerful AI tools
                </p>
              </div>

              {/* Header action buttons */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                <button
                  type="button"
                  className="inv-ai-btn"
                  onClick={() => setAiOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 20px",
                    background: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#000",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <GeminiIcon style={{ width: 16, height: 16 }} />
                  Create with AI
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/app/create-invoice")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 20px",
                    background: "#000",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#fff",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <PlusIcon size={14} />
                  Create Invoice
                </button>
              </div>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div
              style={{
                padding: "14px 20px",
                background: "rgba(254,242,242,0.8)",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: 4,
                marginBottom: 28,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backdropFilter: "blur(10px)",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                color: "#dc2626",
                letterSpacing: "0.3px",
              }}
            >
              <span>⚠ {error.toUpperCase()}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => fetchInvoices()}
                  style={{
                    padding: "6px 14px",
                    background: "transparent",
                    border: "1px solid rgba(220,38,38,0.3)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#dc2626",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  RETRY
                </button>
                {String(error).toLowerCase().includes("unauthorized") && (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{
                      padding: "6px 14px",
                      background: "#dc2626",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    SIGN IN
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Stats grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              { value: allInvoices.length, label: "Total Invoices" },
              {
                value: allInvoices.filter(
                  (i) => (i.status || "").toLowerCase() === "paid"
                ).length,
                label: "Paid",
              },
              {
                value: allInvoices.filter((i) =>
                  ["unpaid", "overdue"].includes((i.status || "").toLowerCase())
                ).length,
                label: "Unpaid",
              },
              {
                value: allInvoices.filter(
                  (i) => (i.status || "").toLowerCase() === "draft"
                ).length,
                label: "Drafts",
              },
            ].map(({ value, label }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.6)",
                  borderRadius: 4,
                  border: "1px solid rgba(0,0,0,0.1)",
                  backdropFilter: "blur(10px)",
                  padding: "24px 28px",
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: "#000",
                    lineHeight: 1,
                    marginBottom: 8,
                    letterSpacing: "-1px",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    color: "#666",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters card ── */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={cardIconBoxStyle}>
                  <FilterIcon size={16} />
                </div>
                <h2 style={cardTitleStyle}>Filters &amp; Search</h2>
              </div>
              <span
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 11,
                  color: "#666",
                  letterSpacing: "0.3px",
                }}
              >
                Showing{" "}
                <strong style={{ color: "#000" }}>{filtered.length}</strong> of{" "}
                {allInvoices.length} invoices
              </span>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Filter grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1.5fr",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                {/* Search */}
                <div>
                  <label style={labelStyle}>Search Invoices</label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#999",
                        pointerEvents: "none",
                      }}
                    >
                      <SearchIcon size={14} />
                    </span>
                    <input
                      className="inv-input"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search by client, invoice ID, email…"
                      style={{ ...inputStyle, paddingLeft: 32 }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                {/* Date range */}
                <div>
                  <label style={labelStyle}>Date Range</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => {
                        setFrom(e.target.value);
                        setPage(1);
                      }}
                      style={{ ...inputStyle, flex: 1 }}
                      aria-label="Start date"
                    />
                    <span
                      style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: 11,
                        color: "#999",
                        flexShrink: 0,
                      }}
                    >
                      to
                    </span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => {
                        setTo(e.target.value);
                        setPage(1);
                      }}
                      style={{ ...inputStyle, flex: 1 }}
                      aria-label="End date"
                    />
                  </div>
                </div>
              </div>

              {/* Footer row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 16,
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      color: "#666",
                    }}
                  >
                    Show
                  </span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: 4,
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: 12,
                      color: "#000",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value={6}>6 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    {
                      label: "Reset",
                      icon: <ResetIcon size={12} />,
                      onClick: () => {
                        setSearch("");
                        setStatus("all");
                        setFrom("");
                        setTo("");
                        setPage(1);
                      },
                    },
                    {
                      label: "Refresh",
                      icon: null,
                      onClick: () => fetchInvoices(),
                    },
                  ].map(({ label, icon, onClick }) => (
                    <button
                      key={label}
                      type="button"
                      className="inv-ghost-btn"
                      onClick={onClick}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        background: "transparent",
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        color: "#000",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Table card ── */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={cardIconBoxStyle}>
                  <ListIcon size={14} />
                </div>
                <h2 style={cardTitleStyle}>All Invoices</h2>
              </div>
              <span
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 11,
                  color: "#666",
                }}
              >
                Sorted by{" "}
                <strong style={{ color: "#000" }}>{sortBy.key}</strong> ·{" "}
                <strong style={{ color: "#000" }}>
                  {sortBy.dir === "asc" ? "Ascending" : "Descending"}
                </strong>
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      { key: "client", label: "Client" },
                      { key: "amount", label: "Amount" },
                      { key: "status", label: "Status" },
                      { key: "dueDate", label: "Due Date" },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        style={thStyle}
                      >
                        {label}
                        <SortIcon
                          dir={sortBy.key === key ? sortBy.dir : "asc"}
                        />
                      </th>
                    ))}
                    <th
                      style={{
                        ...thStyle,
                        textAlign: "right",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((inv) => {
                    const client = normalizeClient(inv.client);
                    const initial = getClientInitial(inv.client);
                    const isHovered = hoveredRow === inv.id;
                    return (
                      <tr
                        key={inv.id}
                        style={{
                          background: isHovered
                            ? "rgba(255,255,255,0.85)"
                            : "transparent",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={() => setHoveredRow(inv.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {/* Client */}
                        <td style={tdStyle}>
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 12 }}
                          >
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 4,
                                background: "rgba(0,0,0,0.06)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#000",
                                flexShrink: 0,
                              }}
                            >
                              {initial}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: "#000",
                                  fontSize: 13,
                                }}
                              >
                                {client.name || inv.company || inv.id}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Courier New', Courier, monospace",
                                  fontSize: 10,
                                  color: "#888",
                                  marginTop: 2,
                                  letterSpacing: "0.3px",
                                }}
                              >
                                {inv.id}
                              </div>
                              {(client.email || inv.email) && (
                                <div
                                  style={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: 10,
                                    color: "#888",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  {client.email || inv.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontFamily: "'Courier New', Courier, monospace",
                              fontWeight: 700,
                              fontSize: 13,
                              color: "#000",
                            }}
                          >
                            {formatCurrency(inv.amount || 0, inv.currency)}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={tdStyle}>
                          <StatusBadge status={inv.status} size="default" showIcon />
                        </td>

                        {/* Due Date */}
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: 12,
                              color: "#666",
                            }}
                          >
                            {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 8,
                            }}
                          >
                            <button
                              type="button"
                              className="inv-action-btn"
                              onClick={() => openInvoice(inv)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                background: "transparent",
                                border: "1px solid rgba(0,0,0,0.15)",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                color: "#000",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <EyeIcon size={12} />
                              View
                            </button>
                            <button
                              type="button"
                              className="inv-delete-btn"
                              onClick={() => handleDeleteInvoice(inv)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 14px",
                                background: "rgba(220,38,38,0.06)",
                                border: "1px solid rgba(220,38,38,0.2)",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                color: "#dc2626",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <DeleteIcon />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty state */}
                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5">
                        <div
                          style={{
                            padding: "60px 20px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 4,
                              background: "rgba(0,0,0,0.05)",
                              border: "1px solid rgba(0,0,0,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto 16px",
                              color: "#999",
                            }}
                          >
                            <InvoiceIcon />
                          </div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: "#000",
                              marginBottom: 8,
                              textTransform: "uppercase",
                              letterSpacing: "-0.5px",
                            }}
                          >
                            No Invoices Found
                          </div>
                          <p
                            style={{
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: 12,
                              color: "#888",
                              marginBottom: 24,
                              letterSpacing: "0.3px",
                            }}
                          >
                            Try adjusting your filters or create a new invoice
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate("/app/create-invoice")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "12px 24px",
                              background: "#000",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontFamily: "'Courier New', Courier, monospace",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                              color: "#fff",
                            }}
                          >
                            <PlusIcon size={12} />
                            Create Your First Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Loading state */}
                  {loading && (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          padding: 48,
                          textAlign: "center",
                          fontFamily: "'Courier New', Courier, monospace",
                          fontSize: 12,
                          color: "#888",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        ◌ Loading invoices…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pageData.length > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => setPage(p)}
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      <AiInvoiceModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onGenerate={handleGenerateFromAI}
        initialText=""
      />
    </>
  );
}