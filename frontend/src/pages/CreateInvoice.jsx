import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
        return `${API_BASE.replace(/\/+$/, "")}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return parsed.href;
    } catch {}
  }
  return `${API_BASE.replace(/\/+$/, "")}/${s.replace(/^\/+/, "")}`;
}

function readJSON(key, fallback = null) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function writeJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
const getStoredInvoices = () => readJSON("invoices_v1", []) || [];
const saveStoredInvoices = (arr) => writeJSON("invoices_v1", arr);

function uid() {
  try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); } catch {}
  return Math.random().toString(36).slice(2, 9);
}

function currencyFmt(amount = 0, currency = "INR") {
  try {
    if (currency === "INR") return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  } catch { return `${currency} ${amount}`; }
}

function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  const subtotal = safe.reduce((s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0), 0);
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  return { subtotal, tax, total: subtotal + tax };
}

function validateInvoice(invoice, items) {
  const errors = [];
  if (!invoice.invoiceNumber?.trim()) errors.push("Invoice number is required");
  if (!invoice.issueDate) errors.push("Invoice date is required");
  if (!invoice.fromBusinessName?.trim()) errors.push("Business name is required");
  if (!invoice.fromEmail?.trim()) errors.push("Business email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.fromEmail)) errors.push("Valid business email is required");
  if (!invoice.client?.name?.trim()) errors.push("Client name is required");
  if (invoice.client?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.client.email)) errors.push("Valid client email is required");
  if (!items?.length) errors.push("At least one item is required");
  else items.forEach((item, idx) => {
    if (!item.description?.trim()) errors.push(`Item ${idx + 1}: Description is required`);
    if (!item.qty || Number(item.qty) <= 0) errors.push(`Item ${idx + 1}: Quantity must be > 0`);
    if (item.unitPrice === undefined || Number(item.unitPrice) < 0) errors.push(`Item ${idx + 1}: Unit price must be ≥ 0`);
  });
  if (invoice.taxPercent !== undefined && (invoice.taxPercent < 0 || invoice.taxPercent > 100)) errors.push("Tax % must be 0–100");
  return errors;
}

/* ─── icons ─── */
const Icon = ({ d, size = 16, extra }) => (
  <svg style={{ width: size, height: size, flexShrink: 0, ...extra }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const PreviewIcon = () => <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" size={15} />;
const SaveIcon = () => <Icon d={["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"]} size={15} />;
const UploadIcon = ({ size = 14 }) => (
  <svg style={{ width: size, height: size, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const DeleteIcon = ({ size = 14 }) => (
  <svg style={{ width: size, height: size, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const AddIcon = () => (
  <svg style={{ width: 15, height: 15, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14m-7-7h14" />
  </svg>
);

/* ─── shared style tokens ─── */
const T = {
  label: {
    display: "block",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
    textTransform: "uppercase", color: "#666", marginBottom: 8,
  },
  input: {
    width: "100%", padding: "10px 12px", fontSize: 13, color: "#000",
    background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 4, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s",
  },
  inputCenter: {
    width: "100%", padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "#000",
    background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 4, outline: "none", boxSizing: "border-box",
    textAlign: "center", fontFamily: "'Courier New', Courier, monospace",
    transition: "border-color 0.15s",
  },
  textarea: {
    width: "100%", padding: "10px 12px", fontSize: 13, color: "#000",
    background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 4, outline: "none", boxSizing: "border-box",
    resize: "vertical", fontFamily: "inherit", transition: "border-color 0.15s",
  },
  card: {
    background: "rgba(255,255,255,0.6)", borderRadius: 4,
    border: "1px solid rgba(0,0,0,0.1)", backdropFilter: "blur(10px)",
    overflow: "hidden", marginBottom: 24,
  },
  cardHeader: {
    padding: "18px 24px", borderBottom: "1px solid rgba(0,0,0,0.08)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  cardHeaderLeft: { display: "flex", alignItems: "center", gap: 14 },
  cardIconBox: {
    width: 38, height: 38, borderRadius: 4, background: "rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center",
    justifyContent: "center", color: "#000", flexShrink: 0,
  },
  cardTitle: {
    fontFamily: "'Courier New', Courier, monospace", fontSize: 12, fontWeight: 700,
    letterSpacing: "1px", textTransform: "uppercase", color: "#000", margin: 0,
  },
  cardBody: { padding: "24px" },
};

/* ─── status badge ─── */
const STATUS_COLORS = {
  draft:   { bg: "rgba(0,0,0,0.04)",    border: "rgba(0,0,0,0.12)",    color: "#555" },
  unpaid:  { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.3)", color: "#92400e" },
  paid:    { bg: "rgba(22,163,74,0.08)", border: "rgba(22,163,74,0.25)", color: "#15803d" },
  overdue: { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)", color: "#dc2626" },
};
const StatusPill = ({ status }) => {
  const s = STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.draft;
  return (
    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 4, background: s.bg, border: `1px solid ${s.border}`, fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: s.color }}>
      {status}
    </span>
  );
};

/* ─── upload zone ─── */
function UploadZone({ dataUrl, onUpload, onRemove, label, hint, height = 100 }) {
  return (
    <div style={{ border: "2px dashed rgba(0,0,0,0.12)", borderRadius: 4, padding: 16, background: "rgba(255,255,255,0.4)" }}>
      {dataUrl ? (
        <div>
          <div style={{ width: "100%", height, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden" }}>
            <img src={dataUrl} alt={label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 12px", background: "transparent", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#000", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#000"; }}>
              <UploadIcon size={12} /> Change
              <input type="file" accept="image/*" onChange={e => onUpload(e.target.files?.[0])} style={{ display: "none" }} />
            </label>
            <button type="button" onClick={onRemove} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 12px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#dc2626", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#dc2626"; }}>
              <DeleteIcon size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label style={{ cursor: "pointer", display: "block" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 0", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <div style={{ width: 38, height: 38, borderRadius: 4, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
              <UploadIcon size={16} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, color: "#000", textTransform: "uppercase", marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{hint}</p>
            </div>
            <input type="file" accept="image/*" onChange={e => onUpload(e.target.files?.[0])} style={{ display: "none" }} />
          </div>
        </label>
      )}
    </div>
  );
}

/* ─── item row ─── */
const ItemRow = React.memo(({ item, index, currency, onUpdate, onRemove }) => {
  const total = Number(item?.qty || 0) * Number(item?.unitPrice || 0);
  const inputStyle = { ...T.input, fontFamily: "'Courier New', Courier, monospace" };
  const numStyle = { ...T.inputCenter, fontSize: 12 };

  return (
    <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 4, padding: "14px 16px", marginBottom: 10 }}>
      {/* Description full width on top */}
      <div style={{ marginBottom: 10 }}>
        <label style={T.label}>Description</label>
        <input style={inputStyle} value={item?.description ?? ""} onChange={e => onUpdate(index, "description", e.target.value)} placeholder="Item / service" onFocus={e => e.target.style.borderColor = "#000"} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"} />
      </div>
      {/* Qty / Price / Total / Delete in a row */}
      <div className="item-row-grid">
        <div>
          <label style={T.label}>Qty</label>
          <input type="text" inputMode="numeric" style={numStyle} value={String(item?.qty ?? "")} onChange={e => onUpdate(index, "qty", e.target.value)} onFocus={e => e.target.style.borderColor = "#000"} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"} />
        </div>
        <div>
          <label style={T.label}>Unit Price</label>
          <input type="text" inputMode="decimal" style={numStyle} value={String(item?.unitPrice ?? "")} onChange={e => onUpdate(index, "unitPrice", e.target.value)} onFocus={e => e.target.style.borderColor = "#000"} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"} />
        </div>
        <div>
          <label style={T.label}>Total</label>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 4, textAlign: "center", fontFamily: "'Courier New', Courier, monospace", fontSize: 12, fontWeight: 700, color: "#000" }}>
            {currencyFmt(total, currency)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="button" onClick={() => onRemove(index)} style={{ padding: 8, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: 4, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", width: "100%" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#dc2626"; }}>
            <DeleteIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});
ItemRow.displayName = "ItemRow";

/* ─── field helper ─── */
function Field({ label, children, span }) {
  return (
    <div style={span ? { gridColumn: "1 / -1" } : {}}>
      <label style={T.label}>{label}</label>
      {children}
    </div>
  );
}

/* ─── card shell ─── */
function Card({ icon, title, badge, children }) {
  return (
    <div style={T.card}>
      <div style={T.cardHeader}>
        <div style={T.cardHeaderLeft}>
          <div style={T.cardIconBox}>{icon}</div>
          <h2 style={T.cardTitle}>{title}</h2>
        </div>
        {badge}
      </div>
      <div style={T.cardBody}>{children}</div>
    </div>
  );
}

/* ─── main component ─── */
export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const loc = useLocation();
  const invoiceFromState = loc.state?.invoice || null;
  const isEditing = Boolean(id && id !== "new");
  const { getToken, isSignedIn } = useAuth();
  const abortRef = useRef(null);
  const autosaveRef = useRef(null);

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      let t = await getToken({ template: "default" }).catch(() => null);
      if (!t) t = await getToken({ forceRefresh: true }).catch(() => null);
      return t;
    } catch { return null; }
  }, [getToken]);

  const buildDefault = () => {
    const localId = uid();
    return {
      id: localId, invoiceNumber: "", issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "", fromBusinessName: "", fromEmail: "", fromAddress: "", fromPhone: "", fromGst: "",
      client: { name: "", email: "", address: "", phone: "" },
      items: [{ id: uid(), description: "Service / Item", qty: 1, unitPrice: 0 }],
      currency: "INR", status: "draft",
      stampDataUrl: null, signatureDataUrl: null, logoDataUrl: null,
      signatureName: "", signatureTitle: "", taxPercent: undefined, notes: "",
    };
  };

  const [invoice, setInvoice] = useState(() => buildDefault());
  const [items, setItems] = useState(invoice.items || []);
  const [loading, setLoading] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const setField = useCallback((field, value) => {
    setInvoice(inv => inv ? { ...inv, [field]: value } : inv);
    setHasUnsaved(true);
  }, []);
  const setClient = useCallback((field, value) => {
    setInvoice(inv => inv ? { ...inv, client: { ...(inv.client || {}), [field]: value } } : inv);
    setHasUnsaved(true);
  }, []);
  const updateItem = useCallback((idx, key, value) => {
    setItems(arr => {
      const copy = arr.slice();
      const it = { ...(copy[idx] || {}) };
      if (key === "description") it.description = value; else it[key] = Number(value) || 0;
      copy[idx] = it;
      setInvoice(inv => inv ? { ...inv, items: copy } : inv);
      setHasUnsaved(true);
      return copy;
    });
  }, []);
  const addItem = useCallback(() => {
    const it = { id: uid(), description: "", qty: 1, unitPrice: 0 };
    setItems(arr => { const next = [...arr, it]; setInvoice(inv => inv ? { ...inv, items: next } : inv); setHasUnsaved(true); return next; });
  }, []);
  const removeItem = useCallback((idx) => {
    setItems(arr => { const next = arr.filter((_, i) => i !== idx); setInvoice(inv => inv ? { ...inv, items: next } : inv); setHasUnsaved(true); return next; });
  }, []);

  const handleImageUpload = useCallback((file, kind) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be < 5MB"); return; }
    if (!file.type.startsWith("image/")) { alert("Please upload a valid image"); return; }
    const reader = new FileReader();
    reader.onload = e => { setInvoice(inv => inv ? { ...inv, [`${kind}DataUrl`]: e.target.result } : inv); setHasUnsaved(true); };
    reader.readAsDataURL(file);
  }, []);
  const removeImage = useCallback((kind) => {
    setInvoice(inv => inv ? { ...inv, [`${kind}DataUrl`]: null } : inv);
    setHasUnsaved(true);
  }, []);

  const genInvoiceNumber = useCallback(async () => {
    for (let i = 0; i < 10; i++) {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const candidate = `INV-${datePart}-${Math.floor(Math.random() * 9000) + 1000}`;
      const local = getStoredInvoices();
      if (local.some(x => x?.invoiceNumber === candidate)) continue;
      try {
        const token = await obtainToken();
        const res = await fetch(`${API_BASE}/api/invoice?invoiceNumber=${encodeURIComponent(candidate)}`, { headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (res.ok) { const j = await res.json().catch(() => null); if (Array.isArray(j?.data) && j.data.length > 0) continue; }
      } catch {}
      return candidate;
    }
    return `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uid().slice(0, 4)}`;
  }, [obtainToken]);

  useEffect(() => {
    if (!isSignedIn) return;
    let mounted = true;
    (async () => {
      const token = await obtainToken();
      if (!token || !mounted) return;
      const ctrl = new AbortController(); abortRef.current = ctrl;
      try {
        const res = await fetch(`${API_BASE}/api/businessProfile/me`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: ctrl.signal });
        if (!res.ok || !mounted) return;
        const j = await res.json().catch(() => null);
        const d = j?.data || j;
        if (!d || !mounted) return;
        setInvoice(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            fromBusinessName: prev.fromBusinessName?.trim() ? prev.fromBusinessName : (d.businessName ?? ""),
            fromEmail: prev.fromEmail?.trim() ? prev.fromEmail : (d.email ?? ""),
            fromAddress: prev.fromAddress?.trim() ? prev.fromAddress : (d.address ?? ""),
            fromPhone: prev.fromPhone?.trim() ? prev.fromPhone : (d.phone ?? ""),
            fromGst: prev.fromGst?.trim() ? prev.fromGst : (d.gst ?? ""),
            logoDataUrl: prev.logoDataUrl || resolveImageUrl(d.logoUrl) || null,
            stampDataUrl: prev.stampDataUrl || resolveImageUrl(d.stampUrl) || null,
            signatureDataUrl: prev.signatureDataUrl || resolveImageUrl(d.signatureUrl) || null,
            signatureName: prev.signatureName || d.signatureOwnerName || "",
            signatureTitle: prev.signatureTitle || d.signatureOwnerTitle || "",
            taxPercent: (prev.taxPercent !== undefined && prev.taxPercent !== null) ? prev.taxPercent : (d.defaultTaxPercent ?? 18),
          };
        });
      } catch (e) { if (e.name !== "AbortError") console.warn("Profile fetch failed:", e); }
    })();
    return () => { mounted = false; abortRef.current?.abort(); };
  }, [isSignedIn, obtainToken]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (invoiceFromState) {
        const base = { ...buildDefault(), ...invoiceFromState };
        base.logoDataUrl = resolveImageUrl(base.logoDataUrl ?? base.logoUrl ?? base.logo) || null;
        base.stampDataUrl = resolveImageUrl(base.stampDataUrl ?? base.stampUrl ?? base.stamp) || null;
        base.signatureDataUrl = resolveImageUrl(base.signatureDataUrl ?? base.signatureUrl ?? base.signature) || null;
        setInvoice(base); setItems(Array.isArray(invoiceFromState.items) ? invoiceFromState.items.slice() : buildDefault().items);
        return;
      }
      if (isEditing) {
        setLoading(true);
        try {
          const token = await obtainToken();
          const ctrl = new AbortController(); abortRef.current = ctrl;
          const res = await fetch(`${API_BASE}/api/invoice/${id}`, { headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, signal: ctrl.signal });
          if (res.ok && mounted) {
            const j = await res.json().catch(() => null);
            const data = j?.data || j;
            if (data) {
              const m = { ...buildDefault(), ...data, id: data._id ?? data.id };
              m.logoDataUrl = resolveImageUrl(data.logoDataUrl ?? data.logoUrl ?? data.logo) || null;
              m.stampDataUrl = resolveImageUrl(data.stampDataUrl ?? data.stampUrl ?? data.stamp) || null;
              m.signatureDataUrl = resolveImageUrl(data.signatureDataUrl ?? data.signatureUrl ?? data.signature) || null;
              setInvoice(m); setItems(Array.isArray(data.items) ? data.items.slice() : m.items); setHasUnsaved(false);
              setLoading(false); return;
            }
          }
        } catch (e) { if (e.name !== "AbortError") console.warn("Invoice fetch failed:", e); }
        finally { if (mounted) setLoading(false); }
        const found = getStoredInvoices().find(x => x && (x.id === id || x._id === id || x.invoiceNumber === id));
        if (found && mounted) {
          const f = { ...buildDefault(), ...found };
          f.logoDataUrl = resolveImageUrl(found.logoDataUrl ?? found.logoUrl ?? found.logo) || null;
          f.stampDataUrl = resolveImageUrl(found.stampDataUrl ?? found.stampUrl ?? found.stamp) || null;
          f.signatureDataUrl = resolveImageUrl(found.signatureDataUrl ?? found.signatureUrl ?? found.signature) || null;
          setInvoice(f); setItems(Array.isArray(found.items) ? found.items.slice() : buildDefault().items); setHasUnsaved(false);
        }
        return;
      }
      setInvoice(buildDefault());
      setItems(buildDefault().items);
      try {
        const num = await genInvoiceNumber();
        if (mounted) setInvoice(inv => inv ? { ...inv, invoiceNumber: num } : inv);
      } catch {}
    })();
    return () => { mounted = false; abortRef.current?.abort(); };
  }, [id, isEditing, obtainToken, genInvoiceNumber]);

  useEffect(() => {
    if (!hasUnsaved) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      try {
        const all = getStoredInvoices();
        const t = computeTotals(items, invoice.taxPercent);
        const prep = { ...invoice, items, ...t };
        const idx = all.findIndex(x => x && (x.id === invoice.id || x._id === invoice.id || x.invoiceNumber === invoice.invoiceNumber));
        if (idx >= 0) all[idx] = prep; else all.unshift(prep);
        saveStoredInvoices(all);
      } catch {}
    }, 5000);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [invoice, items, hasUnsaved]);

  useEffect(() => {
    const h = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); handlePreview(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [invoice, items]);

  useEffect(() => {
    const h = e => { if (hasUnsaved) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasUnsaved]);

  const totals = useMemo(() => computeTotals(items, invoice?.taxPercent ?? 18), [items, invoice?.taxPercent]);

  const handleSave = useCallback(async () => {
    if (!invoice) return;
    const errors = validateInvoice(invoice, items);
    if (errors.length) { setValidationErrors(errors); alert(`Please fix:\n${errors.join("\n")}`); return; }
    setValidationErrors([]); setLoading(true);
    try {
      const t = computeTotals(items, invoice.taxPercent);
      const payload = {
        invoiceNumber: invoice.invoiceNumber?.trim(),
        issueDate: invoice.issueDate || "", dueDate: invoice.dueDate || "",
        fromBusinessName: invoice.fromBusinessName || "", fromEmail: invoice.fromEmail || "",
        fromAddress: invoice.fromAddress || "", fromPhone: invoice.fromPhone || "", fromGst: invoice.fromGst || "",
        client: invoice.client || {}, items: items || [], currency: invoice.currency || "INR",
        status: invoice.status || "draft", taxPercent: Number(invoice.taxPercent ?? 18),
        ...t,
        logoDataUrl: invoice.logoDataUrl || null, stampDataUrl: invoice.stampDataUrl || null,
        signatureDataUrl: invoice.signatureDataUrl || null,
        signatureName: invoice.signatureName || "", signatureTitle: invoice.signatureTitle || "",
        notes: invoice.notes || "", localId: invoice.id,
      };
      const url = isEditing && invoice.id ? `${API_BASE}/api/invoice/${invoice.id}` : `${API_BASE}/api/invoice`;
      const method = isEditing && invoice.id ? "PUT" : "POST";
      const token = await obtainToken();
      const ctrl = new AbortController(); abortRef.current = ctrl;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload), signal: ctrl.signal });
      if (res.status === 409) { const j = await res.json().catch(() => null); throw new Error(j?.message || "Invoice number already exists"); }
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.message || `Save failed (${res.status})`);
      const saved = j?.data || j;
      const merged = { ...payload, id: saved?._id ?? saved?.id ?? invoice.id, invoiceNumber: saved?.invoiceNumber ?? payload.invoiceNumber, ...(saved ? { subtotal: saved.subtotal, tax: saved.tax, total: saved.total } : {}) };
      setInvoice(inv => ({ ...inv, ...merged })); setItems(Array.isArray(saved?.items) ? saved.items : items); setHasUnsaved(false);
      const all = getStoredInvoices();
      const idx = all.findIndex(x => x && (x.id === invoice.id || x.invoiceNumber === invoice.invoiceNumber));
      if (idx >= 0) all[idx] = merged; else all.unshift(merged);
      saveStoredInvoices(all);
      alert(`Invoice ${isEditing ? "updated" : "created"} successfully!`);
      setTimeout(() => navigate("/app/invoices"), 500);
    } catch (err) {
      if (err.name === "AbortError") return;
      if (String(err.message).toLowerCase().includes("invoice number")) { alert(err.message); setLoading(false); return; }
      try {
        const t = computeTotals(items, invoice.taxPercent);
        const prep = { ...invoice, items, ...t };
        const all = getStoredInvoices();
        const idx = all.findIndex(x => x && (x.id === invoice.id || x.invoiceNumber === invoice.invoiceNumber));
        if (idx >= 0) all[idx] = prep; else all.unshift(prep);
        saveStoredInvoices(all); setHasUnsaved(false);
        alert("Saved locally (server error)");
        setTimeout(() => navigate("/app/invoices"), 500);
      } catch { alert("Save failed. Please try again."); }
    } finally { setLoading(false); }
  }, [invoice, items, isEditing, obtainToken, navigate]);

  const handlePreview = useCallback(() => {
    const t = computeTotals(items, invoice.taxPercent);
    navigate(`/app/invoices/${invoice.id}/preview`, { state: { invoice: { ...invoice, items, ...t } } });
  }, [invoice, items, navigate]);

  if (loading && !invoice.id) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #f5f3ed, #ebe8e0, #f5f3ed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase" }}>◌ Loading invoice…</span>
      </div>
    );
  }

  const inp = (value, onChange, placeholder, type = "text") => (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={T.input}
      onFocus={e => e.target.style.borderColor = "#000"}
      onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"}
    />
  );

  const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 };
  const grid3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 24 };

  return (
    <>
      <style>{`
        @keyframes gridMove { from{transform:translate(0,0)} to{transform:translate(50px,50px)} }
        .ci-currency-btn:hover { border-color: #000 !important; background: rgba(0,0,0,0.03) !important; }
        .ci-status-btn:hover { border-color: #000 !important; }
        .ci-add-btn:hover { border-color: rgba(0,0,0,0.25) !important; background: rgba(255,255,255,0.8) !important; }

        /* ── Item row grid ── */
        .item-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }

        /* ── Main two-column layout ── */
        .ci-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: start;
        }

        /* ── Currency/Status row ── */
        .ci-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }

        /* ── Status pills grid ── */
        .ci-status-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        /* ── Header actions ── */
        .ci-header-actions {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        /* ── Header row ── */
        .ci-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .ci-main-grid {
            grid-template-columns: 1fr;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .ci-wrapper {
            padding: 24px 16px !important;
          }

          .ci-header-row {
            flex-direction: column;
          }

          .ci-header-actions {
            width: 100%;
          }

          .ci-header-actions button {
            flex: 1;
            justify-content: center;
          }

          .ci-main-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          /* Currency/Status stack on mobile */
          .ci-meta-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          /* Status: 2x2 grid on mobile */
          .ci-status-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          /* Item row: qty/price/total/delete in 2-col on mobile */
          .item-row-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          /* Invoice details grid: stack */
          .ci-details-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── Very small ── */
        @media (max-width: 400px) {
          .ci-status-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="ci-wrapper" style={{
        position: "relative", minHeight: "100vh",
        background: "linear-gradient(to bottom, #f5f3ed 0%, #ebe8e0 50%, #f5f3ed 100%)",
        padding: "40px 24px", overflow: "hidden",
      }}>
        {/* grid bg */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.3 }}>
          <svg style={{ width: "100%", height: "100%", opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ci-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ci-grid)">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="50 50" dur="20s" repeatCount="indefinite" />
            </rect>
          </svg>
        </div>

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", zIndex: 2 }}>

          {/* ── header ── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", backgroundColor: "#f4d9c6", borderRadius: 4, marginBottom: 20, fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <span>▸</span>
              <span>{isEditing ? "EDIT INVOICE" : "CREATE INVOICE"}</span>
              <span>◂</span>
            </div>

            <div className="ci-header-row">
              <div>
                <h1 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1.5px", color: "#000", textTransform: "uppercase", margin: 0 }}>
                  {isEditing ? "Edit Invoice" : "New Invoice"}
                </h1>
                <p style={{ fontSize: 13, color: "#666", marginTop: 10, fontFamily: "'Courier New', Courier, monospace" }}>
                  {isEditing ? "Update invoice details and items" : "Configure your invoice details, items, and branding"}
                </p>
                {hasUnsaved && (
                  <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, color: "#999", marginTop: 6, letterSpacing: "0.3px" }}>
                    ● UNSAVED CHANGES (autosaving…)
                  </p>
                )}
              </div>

              <div className="ci-header-actions">
                <button onClick={handlePreview} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#000", backdropFilter: "blur(10px)", transition: "all 0.2s", justifyContent: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.9)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  title="Ctrl+P">
                  <PreviewIcon /> Preview
                </button>
                <button onClick={handleSave} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "#000", border: "none", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#fff", opacity: loading ? 0.6 : 1, transition: "all 0.2s", justifyContent: "center" }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  title="Ctrl+S">
                  <SaveIcon /> {loading ? "Saving…" : isEditing ? "Update" : "Save Invoice"}
                </button>
              </div>
            </div>
          </div>

          {/* validation errors */}
          {validationErrors.length > 0 && (
            <div style={{ marginBottom: 24, padding: "16px 20px", background: "rgba(254,242,242,0.8)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 4, backdropFilter: "blur(10px)" }}>
              <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>⚠ Please fix the following errors:</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {validationErrors.map((e, i) => (
                  <li key={i} style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, color: "#dc2626", marginBottom: 3 }}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Invoice Details Card ── */}
          <Card
            icon={<svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
            title="Invoice Details"
          >
            {/* Number / Issue Date / Due Date */}
            <div className="ci-details-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 24 }}>
              <Field label="Invoice Number">
                {inp(invoice?.invoiceNumber || "", v => setField("invoiceNumber", v), "INV-20240101-1234")}
              </Field>
              <Field label="Invoice Date">
                {inp(invoice?.issueDate || "", v => setField("issueDate", v), "", "date")}
              </Field>
              <Field label="Due Date">
                {inp(invoice?.dueDate || "", v => setField("dueDate", v), "", "date")}
              </Field>
            </div>

            {/* Currency + Status */}
            <div className="ci-meta-grid">
              <div>
                <label style={T.label}>Currency</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[{ code: "INR", symbol: "₹", name: "Indian Rupee" }, { code: "USD", symbol: "$", name: "US Dollar" }].map(c => (
                    <button key={c.code} className="ci-currency-btn" type="button" onClick={() => setField("currency", c.code)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: invoice.currency === c.code ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.6)", border: `1px solid ${invoice.currency === c.code ? "#000" : "rgba(0,0,0,0.12)"}`, borderRadius: 4, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#000", lineHeight: 1 }}>{c.symbol}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#000" }}>{c.name}</div>
                        <div style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, color: "#888" }}>{c.code}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={T.label}>Status</label>
                <div className="ci-status-grid">
                  {[{ value: "draft", label: "Draft" }, { value: "unpaid", label: "Unpaid" }, { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" }].map(s => (
                    <button key={s.value} className="ci-status-btn" type="button" onClick={() => setField("status", s.value)} style={{ padding: "10px 6px", background: invoice.status === s.value ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.6)", border: `1px solid ${invoice.status === s.value ? "#000" : "rgba(0,0,0,0.1)"}`, borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                      <StatusPill status={s.label} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ── Main grid ── */}
          <div className="ci-main-grid">
            {/* left column */}
            <div>
              {/* Bill From */}
              <Card icon={<svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} title="Bill From">
                <div style={{ ...grid2, marginBottom: 16 }}>
                  <Field label="Business Name">{inp(invoice?.fromBusinessName ?? "", v => setField("fromBusinessName", v), "Your business name")}</Field>
                  <Field label="Email">{inp(invoice?.fromEmail ?? "", v => setField("fromEmail", v), "business@email.com", "email")}</Field>
                  <Field label="Address" span>
                    <textarea value={invoice?.fromAddress ?? ""} onChange={e => setField("fromAddress", e.target.value)} placeholder="Business address" rows={3} style={T.textarea} onFocus={e => e.target.style.borderColor = "#000"} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"} />
                  </Field>
                  <Field label="Phone">{inp(invoice?.fromPhone ?? "", v => setField("fromPhone", v), "+91 98765 43210")}</Field>
                  <Field label="GST Number">{inp(invoice?.fromGst ?? "", v => setField("fromGst", v), "27AAAPL1234C1ZV")}</Field>
                </div>
              </Card>

              {/* Bill To */}
              <Card icon={<svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} title="Bill To">
                <div style={{ ...grid2, marginBottom: 16 }}>
                  <Field label="Client Name">{inp(invoice?.client?.name || "", v => setClient("name", v), "Client name")}</Field>
                  <Field label="Client Email">{inp(invoice?.client?.email || "", v => setClient("email", v), "client@email.com", "email")}</Field>
                  <Field label="Client Address" span>
                    <textarea value={invoice?.client?.address || ""} onChange={e => setClient("address", e.target.value)} placeholder="Client address" rows={3} style={T.textarea} onFocus={e => e.target.style.borderColor = "#000"} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"} />
                  </Field>
                  <Field label="Client Phone">{inp(invoice?.client?.phone || "", v => setClient("phone", v), "+91 98765 43210")}</Field>
                </div>
              </Card>

              {/* Items */}
              <Card
                icon={<svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="12" y1="8" x2="12" y2="16" /></svg>}
                title="Items & Services"
                badge={<span style={{ padding: "4px 12px", borderRadius: 4, background: "rgba(244,217,198,0.6)", border: "1px solid rgba(244,217,198,0.8)", fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#000" }}>{invoice.currency}</span>}
              >
                {items.map((it, idx) => (
                  <ItemRow key={it?.id ?? idx} item={it} index={idx} currency={invoice.currency} onUpdate={updateItem} onRemove={removeItem} />
                ))}
                <button className="ci-add-btn" type="button" onClick={addItem} style={{ width: "100%", padding: "12px 16px", marginTop: 4, background: "rgba(255,255,255,0.5)", border: "2px dashed rgba(0,0,0,0.12)", borderRadius: 4, cursor: "pointer", fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
                  <AddIcon /> Add Item
                </button>
                <div style={{ marginTop: 20 }}>
                  <label style={T.label}>Notes</label>
                  <textarea value={invoice.notes || ""} onChange={e => setField("notes", e.target.value)} placeholder="Additional notes or payment instructions…" rows={3} style={T.textarea} onFocus={e => e.target.style.borderColor = "#000"} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"} />
                </div>
              </Card>
            </div>

            {/* right sidebar */}
            <div>
              {/* Logo */}
              <Card icon={<svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>} title="Company Logo">
                <UploadZone dataUrl={invoice?.logoDataUrl} onUpload={f => handleImageUpload(f, "logo")} onRemove={() => removeImage("logo")} label="Upload Logo" hint="PNG, JPG up to 5MB" height={120} />
              </Card>

              {/* Tax & Totals */}
              <Card icon={<svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} title="Tax & Totals">
                {[{ label: "Subtotal", value: currencyFmt(totals.subtotal, invoice.currency) }, { label: "Tax Amount", value: currencyFmt(totals.tax, invoice.currency) }].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#666" }}>{label}</span>
                    <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13, fontWeight: 700, color: "#000" }}>{value}</span>
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <label style={T.label}>Tax Percentage</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="number" min="0" max="100" step="0.1" value={invoice.taxPercent ?? 18} onChange={e => setField("taxPercent", Number(e.target.value || 0))} style={{ ...T.inputCenter, flex: 1 }} onFocus={e => e.target.style.borderColor = "#000"} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.1)"} />
                    <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 18, fontWeight: 700, color: "#000" }}>%</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "2px solid #000" }}>
                  <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#000" }}>Total</span>
                  <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 20, fontWeight: 900, color: "#000", letterSpacing: "-0.5px" }}>{currencyFmt(totals.total, invoice.currency)}</span>
                </div>
              </Card>

              {/* Digital Assets */}
              <Card icon={<svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /></svg>} title="Digital Assets">
                <div style={{ marginBottom: 20 }}>
                  <label style={{ ...T.label, marginBottom: 10 }}>Digital Stamp</label>
                  <UploadZone dataUrl={invoice.stampDataUrl} onUpload={f => handleImageUpload(f, "stamp")} onRemove={() => removeImage("stamp")} label="Upload Stamp" hint="PNG with transparent bg" height={80} />
                </div>
                <div>
                  <label style={{ ...T.label, marginBottom: 10 }}>Digital Signature</label>
                  <UploadZone dataUrl={invoice.signatureDataUrl} onUpload={f => handleImageUpload(f, "signature")} onRemove={() => removeImage("signature")} label="Upload Signature" hint="PNG with transparent bg" height={80} />
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Signature Owner Name">{inp(invoice.signatureName || "", v => setField("signatureName", v), "John Doe")}</Field>
                    <Field label="Designation / Title">{inp(invoice.signatureTitle || "", v => setField("signatureTitle", v), "Director / CEO")}</Field>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}