import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

/* ─── CONFIG ─────────────────────────────────────────────── */
const API_BASE = "https://bill-desk-ai-invoice-generator.onrender.com";
const PROFILE_ENDPOINT = `${API_BASE}/api/businessProfile/me`;
const INVOICE_ENDPOINT = (id) => `${API_BASE}/api/invoice/${id}`;

/* ─── HELPERS ────────────────────────────────────────────── */
function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("data:")) return s;
  if (/localhost|127\.0\.0\.1/.test(s)) {
    try {
      const parsed = new URL(s);
      return `${API_BASE.replace(/\/+$/, "")}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return `${API_BASE.replace(/\/+$/, "")}${s.replace(/^https?:\/\/[^/]+/, "")}`;
    }
  }
  if (/^https?:\/\//i.test(s)) return s;
  return `${API_BASE.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

function readJSON(key, fallback = null) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function getStoredInvoices() { return readJSON("invoices_v1", []) || []; }

const defaultProfile = {
  businessName: "", email: "", address: "", phone: "", gst: "",
  stampDataUrl: null, signatureDataUrl: null, logoDataUrl: null,
  defaultTaxPercent: 18, signatureName: "", signatureTitle: "",
};

function currencyFmt(amount = 0, currency = "INR") {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency", currency,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  } catch { return `${currency} ${Number(amount || 0).toFixed(2)}`; }
}

function formatDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(String(d));
  if (isNaN(dt.getTime())) return "—";
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
}

function normalizeClient(raw) {
  if (!raw) return { name:"", email:"", address:"", phone:"" };
  if (typeof raw === "string") return { name:raw, email:"", address:"", phone:"" };
  return {
    name: raw.name ?? raw.company ?? raw.client ?? "",
    email: raw.email ?? raw.emailAddress ?? "",
    address: raw.address ?? raw.addr ?? raw.clientAddress ?? "",
    phone: raw.phone ?? raw.contact ?? raw.mobile ?? "",
  };
}

/* ─── ICONS ──────────────────────────────────────────────── */
const PrintIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <path d="M6 14h12v8H6z"/>
  </svg>
);
const EditIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

/* ─── MAIN ───────────────────────────────────────────────── */
export default function InvoicePreview() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth ? useAuth() : { getToken: null };

  const invoiceFromState = loc?.state?.invoice ?? null;
  const [invoice, setInvoice] = useState(() => invoiceFromState ?? null);
  const [loadingInvoice, setLoadingInvoice] = useState(!invoiceFromState && Boolean(id));
  const [invoiceError, setInvoiceError] = useState(null);
  const [profile, setProfile] = useState(() => readJSON("business_profile", defaultProfile) || defaultProfile);
  const prevTitleRef = useRef(document.title);

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      return await getToken({ template: "default" }).catch(() => null)
          || await getToken({ forceRefresh: true }).catch(() => null);
    } catch { return null; }
  }, [getToken]);

  /* fetch invoice */
  useEffect(() => {
    let mounted = true;
    if (!id || invoiceFromState) return;
    setLoadingInvoice(true);
    (async () => {
      try {
        const token = await obtainToken();
        const res = await fetch(INVOICE_ENDPOINT(id), {
          headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          const data = json?.data ?? json;
          if (mounted && data) {
            setInvoice({ ...data, id: data._id ?? data.id ?? id, items: Array.isArray(data.items) ? data.items : [], currency: data.currency || "INR" });
            setLoadingInvoice(false);
            return;
          }
        }
      } catch {}
      if (!mounted) return;
      const found = getStoredInvoices().find(x => x && (x.id === id || x._id === id || x.invoiceNumber === id));
      if (found) setInvoice(found); else setInvoiceError("Invoice not found");
      setLoadingInvoice(false);
    })();
    return () => { mounted = false; };
  }, [id, invoiceFromState, obtainToken]);

  /* fetch profile */
  useEffect(() => {
    let mounted = true;
    if (readJSON("business_profile", null)) return;
    (async () => {
      try {
        const token = await obtainToken();
        const res = await fetch(PROFILE_ENDPOINT, {
          headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const data = json?.data ?? json;
        if (mounted && data && typeof data === "object") {
          const n = {
            businessName: data.businessName ?? data.name ?? "",
            email: data.email ?? "", address: data.address ?? "",
            phone: data.phone ?? "", gst: data.gst ?? "",
            stampDataUrl: data.stampUrl ?? data.stampDataUrl ?? null,
            signatureDataUrl: data.signatureUrl ?? data.signatureDataUrl ?? null,
            logoDataUrl: data.logoUrl ?? data.logoDataUrl ?? null,
            defaultTaxPercent: isFinite(+data.defaultTaxPercent) ? +data.defaultTaxPercent : 18,
            signatureName: data.signatureOwnerName ?? data.signatureName ?? "",
            signatureTitle: data.signatureOwnerTitle ?? data.signatureTitle ?? "",
          };
          setProfile(n);
          writeJSON("business_profile", n);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [obtainToken]);

  /* page title → PDF filename */
  useEffect(() => {
    if (!invoice) return;
    const safe = `Invoice-${String(invoice.invoiceNumber || invoice.id || Date.now()).replace(/[^\w\-_.() ]/g,"_")}`;
    document.title = safe;
    return () => { try { document.title = prevTitleRef.current; } catch {} };
  }, [invoice]);

  const handlePrint = useCallback(() => {
    const safe = `Invoice-${String((invoice?.invoiceNumber || invoice?.id || Date.now())).replace(/[^\w\-_.() ]/g,"_")}`;
    const prev = document.title;
    document.title = safe;
    window.print();
    setTimeout(() => { document.title = prev; }, 1000);
  }, [invoice]);

  /* ── States ── */
  if (loadingInvoice) return (
    <div style={S.page}>
      <div style={{ padding:64, textAlign:"center", color:"#6b7280", fontSize:14 }}>Loading…</div>
    </div>
  );

  if (invoiceError || !invoice) return (
    <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={S.emptyCard}>
        <div style={S.emptyIcon}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8, color:"#000" }}>Invoice Not Found</h3>
        <p style={{ fontSize:13, color:"#6b7280", marginBottom:24 }}>
          This invoice doesn't exist or may have been deleted.
        </p>
        <button onClick={() => navigate(-1)} style={S.btnPrimary}>
          <ArrowLeftIcon /> Back to Invoices
        </button>
      </div>
    </div>
  );

  /* ── Compute ── */
  const items = (Array.isArray(invoice.items) ? invoice.items : []).filter(Boolean);
  const subtotal = items.reduce((s,it) => s + Number(it.qty||0)*Number(it.unitPrice||0), 0);
  const taxPct   = Number(invoice.taxPercent ?? profile.defaultTaxPercent ?? 18);
  const tax      = subtotal * taxPct / 100;
  const total    = subtotal + tax;

  const logo      = resolveImageUrl(invoice.logoDataUrl      ?? profile.logoDataUrl      ?? null);
  const stamp     = resolveImageUrl(invoice.stampDataUrl     ?? profile.stampDataUrl     ?? null);
  const signature = resolveImageUrl(invoice.signatureDataUrl ?? profile.signatureDataUrl ?? null);
  const sigName   = invoice.signatureName  ?? profile.signatureName  ?? "";
  const sigTitle  = invoice.signatureTitle ?? profile.signatureTitle ?? "";
  const client    = normalizeClient(invoice.client);
  const cur       = invoice.currency || "INR";
  const statusColor = { paid:"#15803d", unpaid:"#b45309", overdue:"#b91c1c", draft:"#6b7280" }[invoice.status] || "#6b7280";
  const statusLabel = invoice.status ? invoice.status[0].toUpperCase()+invoice.status.slice(1) : "Draft";

  return (
    <>
      {/*
        ┌─────────────────────────────────────────────────────────┐
        │  HOW PRINT WORKS WITH THE GLOBAL CSS:                  │
        │  global.css does:  body * { visibility: hidden }       │
        │                    #print-area, #print-area * { visible}│
        │  So #print-area MUST be the invoice wrapper div.       │
        │  The action bar uses class "no-print" which global CSS  │
        │  sets to display:none in print.                        │
        └─────────────────────────────────────────────────────────┘
      */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Action bar ── */
        .ip-topbar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }
        .ip-topbar-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ip-topbar-actions button {
          width: 100%;
          justify-content: center;
        }

        /* ══════════════════════════════
           INVOICE CONTENT — mobile first
        ══════════════════════════════ */

        /* Header: stacked on mobile */
        .print-preview-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .print-preview-invoice-info { text-align: left; }

        .ip-meta-row {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
          font-size: 13px;
          margin-bottom: 5px;
        }
        .ip-meta-label { color: #9ca3af; min-width: 100px; }
        .ip-meta-value { font-weight: 600; color: #000; }

        /* Bill-to / payment: stacked mobile */
        .ip-two-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Table: hide extra cols on mobile, show inline meta */
        .ip-col-qty, .ip-col-up { display: none; }
        .ip-item-meta { display: block; font-size: 11px; color: #9ca3af; margin-top: 3px; }

        /* Totals / sig / stamp: stack on mobile, totals first */
        .ip-bottom-row {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .ip-totals-col { order: 1; }
        .ip-sig-col    { order: 2; }
        .ip-stamp-col  { order: 3; text-align: center; }

        /* Section padding mobile */
        .ip-section { padding: 16px; }

        /* Table base styles */
        .print-preview-table { width: 100%; border-collapse: collapse; }
        .print-preview-table th {
          padding: 10px 8px;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: .4px;
          text-transform: uppercase;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          text-align: left;
        }
        .print-preview-table .right { text-align: right; }
        .print-preview-table td {
          padding: 11px 8px;
          font-size: 13px;
          color: #1f2937;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: top;
        }

        /* ══════════════════════════════
           TABLET / DESKTOP ≥ 768px
        ══════════════════════════════ */
        @media (min-width: 768px) {
          .ip-topbar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .ip-topbar-actions { flex-direction: row; }
          .ip-topbar-actions button { width: auto; }

          .print-preview-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
            gap: 32px;
            padding: 32px;
          }
          .print-preview-invoice-info { text-align: right; flex-shrink: 0; }
          .ip-meta-row { justify-content: flex-end; }
          .ip-meta-label { min-width: unset; }

          .ip-two-col { flex-direction: row; gap: 32px; }
          .ip-two-col > * { flex: 1; }

          .ip-col-qty, .ip-col-up { display: table-cell; }
          .ip-item-meta { display: none; }

          .ip-bottom-row { flex-direction: row; align-items: flex-start; }
          .ip-totals-col, .ip-sig-col, .ip-stamp-col { order: unset; flex: 1; }

          .ip-section { padding: 24px 32px; }
        }

        /* ══════════════════════════════
           PRINT
           The global CSS already handles
           visibility via #print-area.
           We just fix layout inside it.
        ══════════════════════════════ */
        @media print {
          /* Force desktop layout on print regardless of screen size */
          .print-preview-header {
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 32px !important;
            padding: 20px 24px !important;
          }
          .print-preview-invoice-info { text-align: right !important; }
          .ip-meta-row { justify-content: flex-end !important; }
          .ip-two-col { flex-direction: row !important; }
          .ip-two-col > * { flex: 1; }
          .ip-col-qty, .ip-col-up { display: table-cell !important; }
          .ip-item-meta { display: none !important; }
          .ip-bottom-row { flex-direction: row !important; }
          .ip-totals-col, .ip-sig-col, .ip-stamp-col { order: unset !important; flex: 1; }
          .ip-stamp-col { text-align: center !important; }
          .ip-section { padding: 14px 20px !important; }

          /* Prevent orphaned rows / sections */
          .print-preview-header,
          .ip-section,
          .ip-bottom-row { page-break-inside: avoid; break-inside: avoid; }
          tr { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      <div style={S.page}>
        <div style={S.container}>

          {/* Action bar — hidden in print via global .no-print rule */}
          <div className="ip-topbar no-print">
            <div>
              <h1 style={{ fontSize:"clamp(17px,4vw,22px)", fontWeight:700, color:"#000", marginBottom:3 }}>
                Invoice Preview
              </h1>
              <p style={{ fontSize:13, color:"#6b7280" }}>
                #{invoice.invoiceNumber || invoice.id}
              </p>
            </div>
            <div className="ip-topbar-actions">
              <button
                style={S.btnSecondary}
                onClick={() => navigate(`/app/invoices/${invoice.id}/edit`, { state: { invoice } })}
              >
                <EditIcon /> Edit Invoice
              </button>
              <button style={S.btnPrimary} onClick={handlePrint}>
                <PrintIcon /> Print / Save as PDF
              </button>
            </div>
          </div>

          {/*
            id="print-area" — matches the global CSS rule:
              #print-area, #print-area * { visibility: visible }
            This is what makes the invoice appear on print.
            Everything outside this div is invisible.
          */}
          <div id="print-area" style={S.card}>

            {/* 1. HEADER: Company (left) | Invoice meta (right) */}
            <div className="print-preview-header">
              <div className="print-preview-company-info">
                {logo && (
                  <img
                    src={logo} alt="Logo"
                    className="print-preview-logo"
                    style={{ display:"block", marginBottom:14 }}
                    onError={e => e.currentTarget.style.display="none"}
                  />
                )}
                <p style={S.microLabel}>Invoice From</p>
                <p style={{ fontSize:15, fontWeight:700, color:"#000", marginBottom:4 }}>
                  {invoice.fromBusinessName || profile.businessName || "—"}
                </p>
                <p className="print-preview-address" style={{ fontSize:13, color:"#6b7280", whiteSpace:"pre-line", lineHeight:1.6, marginBottom:6 }}>
                  {invoice.fromAddress || profile.address || "—"}
                </p>
                <div style={{ fontSize:13, color:"#6b7280", lineHeight:1.8 }}>
                  {(invoice.fromEmail || profile.email) && <div><b>Email:</b> {invoice.fromEmail || profile.email}</div>}
                  {(invoice.fromPhone || profile.phone) && <div><b>Phone:</b> {invoice.fromPhone || profile.phone}</div>}
                  {(invoice.fromGst   || profile.gst)   && <div><b>GST:</b> {invoice.fromGst || profile.gst}</div>}
                </div>
              </div>

              <div className="print-preview-invoice-info">
                <p style={{ fontSize:"clamp(26px,5vw,38px)", fontWeight:900, letterSpacing:"-1px", color:"#000", lineHeight:1, marginBottom:6 }}>
                  INVOICE
                </p>
                <p style={{ fontFamily:"monospace", fontSize:14, fontWeight:600, color:"#374151", marginBottom:16 }}>
                  #{invoice.invoiceNumber || invoice.id}
                </p>
                <div>
                  {[
                    ["Invoice Date", invoice.issueDate ? formatDate(invoice.issueDate) : "—"],
                    ["Due Date",     invoice.dueDate   ? formatDate(invoice.dueDate)   : "—"],
                  ].map(([label, val]) => (
                    <div key={label} className="ip-meta-row">
                      <span className="ip-meta-label">{label}:</span>
                      <span className="ip-meta-value">{val}</span>
                    </div>
                  ))}
                  <div className="ip-meta-row">
                    <span className="ip-meta-label">Status:</span>
                    <span className="ip-meta-value" style={{ color: statusColor }}>{statusLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BILL TO + PAYMENT DETAILS */}
            <div className="ip-section" style={{ borderBottom:"1px solid #f3f4f6" }}>
              <div className="ip-two-col">
                <div>
                  <p style={S.microLabel}>Bill To</p>
                  <p style={{ fontSize:15, fontWeight:700, color:"#000", marginBottom:4 }}>{client.name || "—"}</p>
                  {client.address && <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.5 }}>{client.address}</p>}
                  {client.email   && <p style={{ fontSize:13, color:"#6b7280" }}>{client.email}</p>}
                  {client.phone   && <p style={{ fontSize:13, color:"#6b7280" }}>{client.phone}</p>}
                </div>
                <div>
                  <p style={S.microLabel}>Payment Details</p>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                    <span style={{ color:"#9ca3af" }}>Currency</span>
                    <span style={{ fontWeight:600, color:"#000" }}>{cur}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. LINE ITEMS TABLE */}
            <div className="ip-section" style={{ borderBottom:"1px solid #f3f4f6", overflowX:"auto" }}>
              <table className="print-preview-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="ip-col-qty right">Qty</th>
                    <th className="ip-col-up right">Unit Price</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? items.map((it, i) => (
                    <tr key={it.id || i}>
                      <td>
                        <span style={{ fontWeight:500 }}>{it.description || "—"}</span>
                        <div className="ip-item-meta">
                          {it.qty} × {currencyFmt(it.unitPrice, cur)}
                        </div>
                      </td>
                      <td className="ip-col-qty right">{it.qty ?? 0}</td>
                      <td className="ip-col-up right">{currencyFmt(it.unitPrice, cur)}</td>
                      <td className="right" style={{ fontWeight:600 }}>
                        {currencyFmt(Number(it.qty||0)*Number(it.unitPrice||0), cur)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign:"center", padding:"24px 0", color:"#9ca3af" }}>
                        No items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. NOTES */}
            {invoice.notes && (
              <div className="ip-section" style={{ borderBottom:"1px solid #f3f4f6" }}>
                <p style={S.microLabel}>Notes</p>
                <p style={{ fontSize:13, color:"#374151", whiteSpace:"pre-line", lineHeight:1.7 }}>{invoice.notes}</p>
              </div>
            )}

            {/* 5. SIGNATURE + STAMP + TOTALS */}
            <div className="ip-section">
              <div className="ip-bottom-row">

                {/* Signature */}
                <div className="ip-sig-col">
                  <p style={S.microLabel}>Authorized Signature</p>
                  {signature ? (
                    <div>
                      <img
                        src={signature} alt="Signature"
                        className="print-preview-signature"
                        style={{ display:"block", marginBottom:8 }}
                        onError={e => e.currentTarget.style.display="none"}
                      />
                      {sigName  && <p style={{ fontSize:13, fontWeight:600, color:"#000" }}>{sigName}</p>}
                      {sigTitle && <p style={{ fontSize:12, color:"#6b7280" }}>{sigTitle}</p>}
                    </div>
                  ) : <div style={S.placeholder}>No Signature</div>}
                </div>

                {/* Stamp */}
                <div className="ip-stamp-col">
                  <p style={S.microLabel}>Company Stamp</p>
                  {stamp ? (
                    <img
                      src={stamp} alt="Stamp"
                      className="print-preview-stamp"
                      style={{ display:"block", margin:"0 auto" }}
                      onError={e => e.currentTarget.style.display="none"}
                    />
                  ) : <div style={S.placeholder}>No Stamp</div>}
                </div>

                {/* Totals */}
                <div className="ip-totals-col">
                  <div className="print-preview-totals">
                    <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:13, color:"#475569" }}>Subtotal</span>
                      <span style={{ fontSize:13, fontWeight:600, color:"#000" }}>{currencyFmt(subtotal, cur)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom:12 }}>
                      <span style={{ fontSize:13, color:"#475569" }}>Tax ({taxPct}%)</span>
                      <span style={{ fontSize:13, fontWeight:600, color:"#000" }}>{currencyFmt(tax, cur)}</span>
                    </div>
                    <div style={{ borderTop:"2px solid #1e293b", paddingTop:12, display:"flex", justifyContent:"space-between", gap:12 }}>
                      <span style={{ fontSize:14, fontWeight:700, color:"#000" }}>Total</span>
                      <span style={{ fontSize:17, fontWeight:800, color:"#000" }}>{currencyFmt(total, cur)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 6. FOOTER */}
            <div style={S.footer}>
              <p style={{ fontSize:13, color:"#374151", marginBottom:4 }}>
                {invoice.terms || invoice.footnote || "Thank you for your business. We appreciate your trust in our services."}
              </p>
              <p style={{ fontSize:11, color:"#9ca3af" }}>
                Invoice generated by InvoiceAI • {formatDate(new Date())}
              </p>
            </div>

          </div>{/* end #print-area */}
        </div>
      </div>
    </>
  );
}

/* ─── STYLE OBJECTS ──────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    background: "#f5f1e8",
    padding: "20px 12px 56px",
  },
  container: {
    maxWidth: 920,
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  microLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    color: "#9ca3af",
    marginBottom: 10,
  },
  placeholder: {
    padding: "14px 18px",
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: 6,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  footer: {
    padding: "18px 24px",
    background: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
    textAlign: "center",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 20px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 20px",
    background: "#fff",
    color: "#000",
    border: "1px solid #d1d5db",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    minHeight: 44,
  },
  emptyCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "48px 32px",
    textAlign: "center",
    maxWidth: 400,
    width: "100%",
  },
  emptyIcon: {
    width: 60,
    height: 60,
    background: "#fef2f2",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
};