import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

const API_BASE = "https://bill-desk-ai-invoice-generator.onrender.com";

/* ---------- small icon components ---------- */
const UploadIcon = () => (
  <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const ImageIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const DeleteIcon = () => (
  <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const SaveIcon = () => (
  <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const ResetIcon = () => (
  <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const BusinessIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4m0 4h4" />
  </svg>
);
const PenIcon = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
  </svg>
);
const UserIconSvg = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function resolveImageUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith("blob:") || s.startsWith("data:")) return s;
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

/* ---------- Shared style helpers ---------- */
const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  color: "#000",
  background: "rgba(255, 255, 255, 0.8)",
  border: "1px solid rgba(0, 0, 0, 0.12)",
  borderRadius: 6,
  outline: "none",
  boxSizing: "border-box",
  WebkitAppearance: "none",
  appearance: "none",
  transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: "#666",
  marginBottom: 8,
};

const cardStyle = {
  background: "rgba(255, 255, 255, 0.65)",
  borderRadius: 8,
  border: "1px solid rgba(0, 0, 0, 0.1)",
  backdropFilter: "blur(10px)",
  overflow: "hidden",
};

const cardHeaderStyle = {
  padding: "18px 20px",
  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

/* ---------- Reusable upload zone ---------- */
function UploadZone({ kind, preview, onPick, onRemove, label, hint, icon: Icon }) {
  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#000", marginBottom: 14, marginTop: 0 }}>{label}</h3>
      <div
        style={{
          border: "2px dashed rgba(0,0,0,0.15)",
          borderRadius: 8,
          padding: 20,
          background: "rgba(255,255,255,0.5)",
        }}
      >
        {preview ? (
          <div>
            <div
              style={{
                width: "100%",
                height: 120,
                background: "rgba(0,0,0,0.02)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              <img
                src={preview}
                alt={`${kind} preview`}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <label
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "11px 12px",
                  background: "rgba(0,0,0,0.05)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#000",
                  minHeight: 44,
                  boxSizing: "border-box",
                }}
              >
                <UploadIcon />
                Change
                <input type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0])} style={{ display: "none" }} />
              </label>
              <button
                type="button"
                onClick={onRemove}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "11px 12px",
                  background: "rgba(220,38,38,0.1)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#dc2626",
                  minHeight: 44,
                }}
              >
                <DeleteIcon />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label style={{ cursor: "pointer", display: "block" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "20px 16px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                <Icon />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 4, textTransform: "uppercase" }}>
                  Upload {label}
                </p>
                <p style={{ fontSize: 11, color: "#666", margin: 0 }}>{hint}</p>
              </div>
              <input type="file" accept="image/*" onChange={(e) => onPick(e.target.files?.[0])} style={{ display: "none" }} />
            </div>
          </label>
        )}
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */
export default function BusinessProfile() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [meta, setMeta] = useState({});
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState({ logo: null, stamp: null, signature: null });
  const [previews, setPreviews] = useState({ logo: null, stamp: null, signature: null });

  async function getAuthToken() {
    if (typeof getToken !== "function") return null;
    try {
      let t = await getToken({ template: "default" }).catch(() => null);
      if (!t) t = await getToken({ forceRefresh: true }).catch(() => null);
      return t;
    } catch { return null; }
  }

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      if (!isSignedIn) return;
      const token = await getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/businessProfile/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const data = json?.data;
        if (!data || !mounted) return;
        const serverMeta = {
          businessName: data.businessName ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          gst: data.gst ?? "",
          logoUrl: data.logoUrl ?? null,
          stampUrl: data.stampUrl ?? null,
          signatureUrl: data.signatureUrl ?? null,
          signatureOwnerName: data.signatureOwnerName ?? "",
          signatureOwnerTitle: data.signatureOwnerTitle ?? "",
          defaultTaxPercent: data.defaultTaxPercent ?? 18,
          notes: data.notes ?? "",
          profileId: data._id ?? data.id ?? null,
        };
        setMeta(serverMeta);
        setPreviews((p) => ({
          ...p,
          logo: resolveImageUrl(serverMeta.logoUrl),
          stamp: resolveImageUrl(serverMeta.stampUrl),
          signature: resolveImageUrl(serverMeta.signatureUrl),
        }));
      } catch (err) { console.error("Error fetching business profile:", err); }
    }
    fetchProfile();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, getToken]);

  function updateMeta(field, value) { setMeta((m) => ({ ...m, [field]: value })); }

  function handleLocalFilePick(kind, file) {
    if (!file) return;
    const prev = previews[kind];
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    const objUrl = URL.createObjectURL(file);
    setFiles((f) => ({ ...f, [kind]: file }));
    setPreviews((p) => ({ ...p, [kind]: objUrl }));
    updateMeta(kind === "logo" ? "logoUrl" : kind === "stamp" ? "stampUrl" : "signatureUrl", objUrl);
  }

  function removeLocalFile(kind) {
    const prev = previews[kind];
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    setFiles((f) => ({ ...f, [kind]: null }));
    setPreviews((p) => ({ ...p, [kind]: null }));
    updateMeta(kind === "logo" ? "logoUrl" : kind === "stamp" ? "stampUrl" : "signatureUrl", null);
  }

  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) { alert("You must be signed in to save your business profile."); return; }
      const fd = new FormData();
      fd.append("businessName", meta.businessName || "");
      fd.append("email", meta.email || "");
      fd.append("address", meta.address || "");
      fd.append("phone", meta.phone || "");
      fd.append("gst", meta.gst || "");
      fd.append("defaultTaxPercent", String(meta.defaultTaxPercent ?? 18));
      fd.append("signatureOwnerName", meta.signatureOwnerName || "");
      fd.append("signatureOwnerTitle", meta.signatureOwnerTitle || "");
      fd.append("notes", meta.notes || "");
      if (files.logo) fd.append("logoName", files.logo);
      else if (meta.logoUrl) fd.append("logoUrl", meta.logoUrl);
      if (files.stamp) fd.append("stampName", files.stamp);
      else if (meta.stampUrl) fd.append("stampUrl", meta.stampUrl);
      if (files.signature) fd.append("signatureNameMeta", files.signature);
      else if (meta.signatureUrl) fd.append("signatureUrl", meta.signatureUrl);
      const profileId = meta.profileId;
      const url = profileId ? `${API_BASE}/api/businessProfile/${profileId}` : `${API_BASE}/api/businessProfile`;
      const method = profileId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Save failed (${res.status})`);
      const saved = json?.data || json;
      const merged = {
        ...meta,
        businessName: saved.businessName ?? meta.businessName,
        email: saved.email ?? meta.email,
        address: saved.address ?? meta.address,
        phone: saved.phone ?? meta.phone,
        gst: saved.gst ?? meta.gst,
        logoUrl: saved.logoUrl ?? meta.logoUrl,
        stampUrl: saved.stampUrl ?? meta.stampUrl,
        signatureUrl: saved.signatureUrl ?? meta.signatureUrl,
        signatureOwnerName: saved.signatureOwnerName ?? meta.signatureOwnerName,
        signatureOwnerTitle: saved.signatureOwnerTitle ?? meta.signatureOwnerTitle,
        defaultTaxPercent: saved.defaultTaxPercent ?? meta.defaultTaxPercent,
        notes: saved.notes ?? meta.notes,
        profileId: saved._id ?? meta.profileId ?? saved.id,
      };
      setMeta(merged);
      if (saved.logoUrl) setPreviews((p) => ({ ...p, logo: resolveImageUrl(saved.logoUrl) }));
      if (saved.stampUrl) setPreviews((p) => ({ ...p, stamp: resolveImageUrl(saved.stampUrl) }));
      if (saved.signatureUrl) setPreviews((p) => ({ ...p, signature: resolveImageUrl(saved.signatureUrl) }));
      alert(`Profile ${profileId ? "updated" : "created"} successfully.`);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(err?.message || "Failed to save profile. See console for details.");
    } finally { setSaving(false); }
  }

  function handleClearProfile() {
    if (!confirm("Clear current profile data? This will remove local changes and previews.")) return;
    Object.values(previews).forEach((u) => { if (u?.startsWith("blob:")) URL.revokeObjectURL(u); });
    setMeta({});
    setFiles({ logo: null, stamp: null, signature: null });
    setPreviews({ logo: null, stamp: null, signature: null });
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        
        .bp-field-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .bp-field-full { grid-column: 1 / -1; }

        .bp-assets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }

        .bp-action-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }

        .bp-action-btn {
          flex: 0 0 auto;
        }

        .bp-input:focus { border-color: #000 !important; }

        @media (max-width: 640px) {
          .bp-field-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .bp-field-full { grid-column: 1; }

          .bp-assets-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .bp-action-bar {
            flex-direction: column-reverse;
            gap: 10px;
          }

          .bp-action-btn {
            width: 100%;
            justify-content: center;
          }

          .bp-card-header {
            padding: 16px !important;
          }

          .bp-card-body {
            padding: 20px 16px !important;
          }
        }

        @media (max-width: 400px) {
          .bp-branding-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #f5f3ed 0%, #ebe8e0 50%, #f5f3ed 100%)",
          padding: "32px 16px 48px",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.3 }}>
          <svg style={{ width: "100%", height: "100%", opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="business-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#business-grid)">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="50 50" dur="20s" repeatCount="indefinite" />
            </rect>
          </svg>
        </div>

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", zIndex: 2 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 16px",
                backgroundColor: "#f4d9c6",
                borderRadius: 4,
                marginBottom: 16,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              <span>▸</span>
              <span>BUSINESS PROFILE</span>
              <span>◂</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(26px, 8vw, 48px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
                marginBottom: 10,
                color: "#000",
                textTransform: "uppercase",
              }}
            >
              Your Business
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#666", maxWidth: 600, margin: 0 }}>
              Configure your company details, branding assets, and invoice defaults
            </p>

            {!isSignedIn && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 16px",
                  background: "rgba(254,243,199,0.6)",
                  border: "1px solid rgba(146,64,14,0.2)",
                  borderRadius: 6,
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 11,
                  color: "#92400e",
                  letterSpacing: "0.5px",
                }}
              >
                ⚠ YOU ARE NOT SIGNED IN — CHANGES CANNOT BE SAVED
              </div>
            )}
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Business Information ── */}
            <div style={cardStyle}>
              <div className="bp-card-header" style={{ ...cardHeaderStyle }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
                  <BusinessIcon />
                </div>
                <h2 style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#000", margin: 0 }}>
                  Business Information
                </h2>
              </div>

              <div className="bp-card-body" style={{ padding: "28px 28px" }}>
                <div className="bp-field-grid">
                  <div>
                    <label style={labelStyle}>Business Name</label>
                    <input
                      className="bp-input"
                      style={inputStyle}
                      value={meta.businessName || ""}
                      onChange={(e) => updateMeta("businessName", e.target.value)}
                      placeholder="Enter your business name"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      className="bp-input"
                      style={inputStyle}
                      type="email"
                      value={meta.email || ""}
                      onChange={(e) => updateMeta("email", e.target.value)}
                      placeholder="business@email.com"
                    />
                  </div>

                  <div className="bp-field-full">
                    <label style={labelStyle}>Address</label>
                    <textarea
                      className="bp-input"
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                      value={meta.address || ""}
                      onChange={(e) => updateMeta("address", e.target.value)}
                      placeholder="Enter your business address"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input
                      className="bp-input"
                      style={inputStyle}
                      type="tel"
                      value={meta.phone || ""}
                      onChange={(e) => updateMeta("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>GST Number</label>
                    <input
                      className="bp-input"
                      style={inputStyle}
                      value={meta.gst || ""}
                      onChange={(e) => updateMeta("gst", e.target.value)}
                      placeholder="27AAAPL1234C1ZV"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Branding & Defaults ── */}
            <div style={cardStyle}>
              <div className="bp-card-header" style={{ ...cardHeaderStyle }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
                  <ImageIcon />
                </div>
                <h2 style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#000", margin: 0 }}>
                  Branding & Defaults
                </h2>
              </div>

              <div className="bp-card-body" style={{ padding: "28px 28px" }}>
                <div
                  className="bp-branding-grid"
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}
                >
                  {/* Logo */}
                  <UploadZone
                    kind="logo"
                    preview={previews.logo}
                    onPick={(f) => handleLocalFilePick("logo", f)}
                    onRemove={() => removeLocalFile("logo")}
                    label="Company Logo"
                    hint="PNG, JPG up to 5MB"
                    icon={UploadIcon}
                  />

                  {/* Tax Settings */}
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#000", marginBottom: 14, marginTop: 0 }}>Tax Settings</h3>
                    <div style={{ padding: 20, background: "rgba(255,255,255,0.5)", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)" }}>
                      <label style={labelStyle}>Default Tax Percentage</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <input
                          className="bp-input"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          style={{ ...inputStyle, flex: 1 }}
                          value={meta.defaultTaxPercent ?? 18}
                          onChange={(e) => updateMeta("defaultTaxPercent", Number(e.target.value || 0))}
                        />
                        <span style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 20, fontWeight: 700, color: "#000" }}>%</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#666", margin: 0 }}>This tax rate will prefill in new invoices</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Digital Assets ── */}
            <div style={cardStyle}>
              <div className="bp-card-header" style={{ ...cardHeaderStyle }}>
                <div style={{ width: 44, height: 44, borderRadius: 6, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
                  <PenIcon />
                </div>
                <h2 style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#000", margin: 0 }}>
                  Digital Assets
                </h2>
              </div>

              <div className="bp-card-body" style={{ padding: "28px 28px" }}>
                <div className="bp-assets-grid">
                  {/* Stamp */}
                  <UploadZone
                    kind="stamp"
                    preview={previews.stamp}
                    onPick={(f) => handleLocalFilePick("stamp", f)}
                    onRemove={() => removeLocalFile("stamp")}
                    label="Digital Stamp"
                    hint="PNG with transparent background"
                    icon={ImageIcon}
                  />

                  {/* Signature */}
                  <div>
                    <UploadZone
                      kind="signature"
                      preview={previews.signature}
                      onPick={(f) => handleLocalFilePick("signature", f)}
                      onRemove={() => removeLocalFile("signature")}
                      label="Digital Signature"
                      hint="PNG with transparent background"
                      icon={UserIconSvg}
                    />

                    {/* Signature meta fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
                      <div>
                        <label style={labelStyle}>Signature Owner Name</label>
                        <input
                          className="bp-input"
                          placeholder="John Doe"
                          value={meta.signatureOwnerName || ""}
                          onChange={(e) => updateMeta("signatureOwnerName", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Signature Title / Designation</label>
                        <input
                          className="bp-input"
                          placeholder="Director / CEO"
                          value={meta.signatureOwnerTitle || ""}
                          onChange={(e) => updateMeta("signatureOwnerTitle", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Bar ── */}
            <div
              style={{
                padding: "20px 20px",
                background: "rgba(255,255,255,0.65)",
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="bp-action-bar">
                <button
                  type="button"
                  className="bp-action-btn"
                  onClick={handleClearProfile}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "13px 24px",
                    background: "rgba(220,38,38,0.1)",
                    border: "1px solid rgba(220,38,38,0.2)",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#dc2626",
                    minHeight: 48,
                  }}
                >
                  <ResetIcon />
                  Clear Profile
                </button>

                <button
                  type="submit"
                  className="bp-action-btn"
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "13px 28px",
                    background: "#000",
                    border: "none",
                    borderRadius: 6,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#fff",
                    opacity: saving ? 0.6 : 1,
                    minHeight: 48,
                  }}
                >
                  <SaveIcon />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}