import React, { useEffect, useRef, useState, useCallback } from "react";
import GeminiIcon from "./GeminiIcon";

/* ─── Web Speech API singleton ─── */
const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const SPEECH_SUPPORTED = Boolean(SpeechRecognition);

/* ─── icons ─── */
const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const StopIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const TrashIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SpinnerIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ animation: "ai-spin 1s linear infinite", flexShrink: 0 }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/* ─── component ─── */
export default function AiInvoiceModal({ open, onClose, onGenerate, initialText = "" }) {
  const [text, setText] = useState(initialText || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* voice state */
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);

  /* reset on open/close */
  useEffect(() => {
    setText(initialText || "");
    setError("");
    setLoading(false);
    setInterimText("");
    setMicError("");
    if (!open) stopListening();
  }, [open, initialText]);

  /* Escape key */
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") { stopListening(); onClose?.(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  /* ── speech recognition ── */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setListening(false);
    setInterimText("");
  }, []);

  const startListening = useCallback(() => {
    if (!SPEECH_SUPPORTED) {
      setMicError("Voice input is not supported in your browser. Try Chrome or Edge.");
      return;
    }
    setMicError("");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (final) setText(prev => {
        const base = prev.trim();
        return base ? base + " " + final.trim() : final.trim();
      });
      setInterimText(interim);
    };

    recognition.onerror = (e) => {
      if (e.error === "not-allowed") setMicError("Microphone access denied. Please allow microphone permission and try again.");
      else if (e.error === "no-speech") setMicError("No speech detected. Please speak closer to the microphone.");
      else if (e.error !== "aborted") setMicError(`Voice error: ${e.error}`);
      setListening(false);
      setInterimText("");
    };

    recognition.onend = () => { setListening(false); setInterimText(""); };

    try { recognition.start(); }
    catch { setMicError("Could not start voice input. Please try again."); setListening(false); }
  }, []);

  const toggleListening = useCallback(() => {
    listening ? stopListening() : startListening();
  }, [listening, startListening, stopListening]);

  /* ── generate ── */
  async function handleGenerate() {
    stopListening();
    setError("");
    const raw = (text || "").trim();
    if (!raw) { setError("Please enter or speak some invoice details before generating."); return; }
    try {
      setLoading(true);
      const p = onGenerate?.(raw);
      if (p && typeof p.then === "function") await p;
    } catch (err) {
      const msg = err?.message || (typeof err === "string" ? err : JSON.stringify(err));
      setError(msg || "Failed to generate. Try again.");
    } finally { setLoading(false); }
  }

  const isQuotaError = /quota|exhausted|resource_exhausted/i.test(String(error));
  const displayText = text + (interimText ? (text ? " " : "") + interimText : "");

  if (!open) return null;

  /* ── shared style tokens ── */
  const monoLabel = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
    textTransform: "uppercase", color: "#666",
  };

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity:0; transform:scale(0.97) translateY(8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes overlayFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes ai-spin        { to { transform:rotate(360deg); } }
        @keyframes ai-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.45); }
          60%      { box-shadow: 0 0 0 9px rgba(220,38,38,0); }
        }
        @keyframes ai-wave {
          0%,100% { transform:scaleY(0.35); }
          50%      { transform:scaleY(1); }
        }
        .ai-modal-ta::placeholder { color:#999; font-style:italic; }
        .ai-modal-ta:focus        { border-color:#000 !important; outline:none; }
        .ai-close:hover           { background:rgba(0,0,0,0.08) !important; }
        .ai-mic-idle:hover        { background:rgba(0,0,0,0.06) !important; border-color:#000 !important; }
        .ai-clear:hover           { background:rgba(220,38,38,0.07) !important; color:#dc2626 !important; border-color:rgba(220,38,38,0.3) !important; }
        .ai-cancel:hover          { background:rgba(255,255,255,0.9) !important; }
        .ai-gen:hover:not(:disabled) { transform:translateY(-2px) !important; box-shadow:0 8px 20px rgba(0,0,0,0.2) !important; }
        .ai-gen:disabled          { opacity:0.6; cursor:not-allowed; }
      `}</style>

      {/* overlay */}
      <div style={{
        position:"fixed", inset:0, zIndex:1000,
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:24, animation:"overlayFadeIn 0.2s ease",
      }}>
        {/* backdrop */}
        <div onClick={() => { stopListening(); onClose?.(); }} aria-hidden="true"
          style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)" }} />

        {/* modal */}
        <div style={{
          position:"relative", width:"100%", maxWidth:740,
          background:"linear-gradient(135deg,#f5f3ed 0%,#ebe8e0 100%)",
          borderRadius:4, border:"1px solid rgba(0,0,0,0.12)",
          boxShadow:"0 24px 60px rgba(0,0,0,0.18),0 4px 16px rgba(0,0,0,0.08)",
          overflow:"hidden", animation:"modalFadeIn 0.25s cubic-bezier(0.34,1.2,0.64,1)",
        }}>
          {/* grid bg */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.2 }}>
            <svg style={{ width:"100%", height:"100%" }} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="ai-mg" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#ai-mg)">
                <animateTransform attributeName="transform" type="translate" from="0 0" to="50 50" dur="20s" repeatCount="indefinite" />
              </rect>
            </svg>
          </div>

          {/* body */}
          <div style={{ position:"relative", padding:"28px 32px 32px" }}>

            {/* ── header ── */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ flex:1, paddingRight:16 }}>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:10,
                  padding:"6px 14px", backgroundColor:"#f4d9c6", borderRadius:4, marginBottom:14,
                  fontFamily:"'Courier New',Courier,monospace", fontSize:10, fontWeight:700,
                  letterSpacing:"0.5px", boxShadow:"0 2px 6px rgba(0,0,0,0.06)",
                }}>
                  <span>▸</span><GeminiIcon style={{ width:14, height:14 }} /><span>AI INVOICE GENERATOR</span><span>◂</span>
                </div>
                <h3 style={{ fontSize:22, fontWeight:900, lineHeight:1.1, letterSpacing:"-0.5px", color:"#000", textTransform:"uppercase", margin:0, marginBottom:10 }}>
                  Create with AI
                </h3>
                <p style={{ fontFamily:"'Courier New',Courier,monospace", fontSize:11, color:"#444", lineHeight:1.7, margin:0, letterSpacing:"0.2px" }}>
                  Type or <strong>speak</strong> your invoice details — client name, items, quantities, prices — and we'll extract a structured invoice.
                </p>
              </div>
              <button className="ai-close" onClick={() => { stopListening(); onClose?.(); }} aria-label="Close"
                style={{ width:32, height:32, borderRadius:4, flexShrink:0, background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#000", transition:"background 0.15s" }}>
                ✕
              </button>
            </div>

            {/* ── label row ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <label style={monoLabel}>Invoice Details</label>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>

                {/* clear */}
                {(text || interimText) && (
                  <button className="ai-clear" type="button" onClick={() => { setText(""); setInterimText(""); }}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"transparent", border:"1px solid rgba(0,0,0,0.12)", borderRadius:4, cursor:"pointer", fontFamily:"'Courier New',Courier,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.4px", textTransform:"uppercase", color:"#666", transition:"all 0.15s" }}>
                    <TrashIcon size={11} /> Clear
                  </button>
                )}

                {/* mic button */}
                {SPEECH_SUPPORTED ? (
                  <button type="button" onClick={toggleListening}
                    title={listening ? "Stop recording" : "Start voice input"}
                    className={listening ? "" : "ai-mic-idle"}
                    style={{
                      display:"flex", alignItems:"center", gap:7, padding:"7px 16px",
                      background: listening ? "#dc2626" : "rgba(255,255,255,0.75)",
                      border: listening ? "none" : "1px solid rgba(0,0,0,0.15)",
                      borderRadius:4, cursor:"pointer",
                      fontFamily:"'Courier New',Courier,monospace", fontSize:10, fontWeight:700,
                      letterSpacing:"0.5px", textTransform:"uppercase",
                      color: listening ? "#fff" : "#000",
                      transition:"all 0.2s",
                      animation: listening ? "ai-pulse 1.6s ease-in-out infinite" : "none",
                      boxShadow: listening ? "0 2px 10px rgba(220,38,38,0.3)" : "none",
                    }}>
                    {listening
                      ? <><StopIcon size={13} /> Stop Recording</>
                      : <><MicIcon size={14} /> Speak</>
                    }
                  </button>
                ) : (
                  <span style={{ display:"flex", alignItems:"center", gap:5, fontFamily:"'Courier New',Courier,monospace", fontSize:10, color:"#bbb" }}>
                    <MicOffIcon size={13} /> Voice unavailable
                  </span>
                )}
              </div>
            </div>

            {/* ── listening bar ── */}
            {listening && (
              <div style={{
                display:"flex", alignItems:"center", gap:12, padding:"10px 14px", marginBottom:10,
                background:"rgba(220,38,38,0.05)", border:"1px solid rgba(220,38,38,0.18)", borderRadius:4,
              }}>
                {/* waveform */}
                <div style={{ display:"flex", alignItems:"center", gap:3, flexShrink:0 }}>
                  {[0.0, 0.15, 0.3, 0.45, 0.2, 0.35, 0.1].map((d, i) => (
                    <div key={i} style={{ width:3, height:18, background:"#dc2626", borderRadius:2, animation:`ai-wave 0.75s ease-in-out ${d}s infinite` }} />
                  ))}
                </div>
                <span style={{ fontFamily:"'Courier New',Courier,monospace", fontSize:11, fontWeight:700, color:"#dc2626", letterSpacing:"0.5px", textTransform:"uppercase", flexShrink:0 }}>
                  Listening…
                </span>
                {interimText && (
                  <span style={{ fontFamily:"'Courier New',Courier,monospace", fontSize:11, color:"#888", fontStyle:"italic", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    "{interimText}"
                  </span>
                )}
              </div>
            )}

            {/* ── textarea ── */}
            <div style={{ position:"relative", marginBottom:20 }}>
              <textarea
                className="ai-modal-ta"
                value={displayText}
                onChange={e => { if (!listening) setText(e.target.value); }}
                readOnly={listening}
                placeholder={`e.g. Sarah Johnson wants a logo for her organic brand "GreenVibe." Quoted $120 for 3 logo options, final delivery in PNG and vector.\n\nOr click "Speak" to dictate details aloud.`}
                rows={7}
                style={{
                  width:"100%", boxSizing:"border-box", padding:"14px 16px",
                  background: listening ? "#fff9f9" : "#fff",
                  border: `1px solid ${listening ? "rgba(220,38,38,0.3)" : "rgba(0,0,0,0.15)"}`,
                  borderRadius:4, fontSize:14, color:"#111", lineHeight:1.7,
                  fontFamily:"inherit", resize: listening ? "none" : "vertical",
                  transition:"border-color 0.2s,background 0.2s",
                  boxShadow:"inset 0 1px 3px rgba(0,0,0,0.04)",
                  cursor: listening ? "default" : "text",
                }}
              />
              {text.length > 0 && !listening && (
                <span style={{ position:"absolute", bottom:10, right:12, fontFamily:"'Courier New',Courier,monospace", fontSize:10, color:"#ccc", pointerEvents:"none" }}>
                  {text.length} chars
                </span>
              )}
            </div>

            {/* mic permission/browser error */}
            {micError && (
              <div style={{ marginBottom:16, padding:"12px 16px", background:"rgba(255,251,235,0.9)", border:"1px solid rgba(217,119,6,0.25)", borderRadius:4, fontFamily:"'Courier New',Courier,monospace", fontSize:11, color:"#92400e", lineHeight:1.6 }}>
                ⚠ {micError}
              </div>
            )}

            {/* generate error */}
            {error && (
              <div role="alert" style={{ marginBottom:20, padding:"14px 16px", background:"rgba(254,242,242,0.85)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:4, fontFamily:"'Courier New',Courier,monospace", fontSize:11, color:"#dc2626", lineHeight:1.6, letterSpacing:"0.2px" }}>
                {String(error).split("\n").map((l, i) => <div key={i}>⚠ {l}</div>)}
                {isQuotaError && (
                  <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(220,38,38,0.15)", color:"#666", fontSize:11 }}>
                    AI quota exceeded. Try again in a few minutes, or create the invoice manually.
                  </div>
                )}
              </div>
            )}

            {/* ── actions ── */}
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <button type="button" className="ai-cancel" onClick={() => { stopListening(); onClose?.(); }}
                style={{ padding:"12px 20px", background:"rgba(255,255,255,0.6)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:4, cursor:"pointer", fontFamily:"'Courier New',Courier,monospace", fontSize:11, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", color:"#000", backdropFilter:"blur(10px)", transition:"all 0.15s" }}>
                Cancel
              </button>

              <button type="button" className="ai-gen" onClick={handleGenerate} disabled={loading || listening}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"13px 24px", background:"#000", border:"none", borderRadius:4, cursor:(loading || listening) ? "not-allowed" : "pointer", fontFamily:"'Courier New',Courier,monospace", fontSize:11, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", color:"#fff", transition:"all 0.25s", boxShadow:"0 2px 8px rgba(0,0,0,0.12)", opacity:(loading || listening) ? 0.6 : 1 }}>
                {loading
                  ? <><SpinnerIcon size={14} /> Generating…</>
                  : listening
                  ? <><MicIcon size={14} /> Finish speaking first…</>
                  : <><GeminiIcon style={{ width:16, height:16 }} /> Generate Invoice</>
                }
              </button>
            </div>

            {/* hint */}
            <p style={{ marginTop:16, marginBottom:0, fontFamily:"'Courier New',Courier,monospace", fontSize:10, color:"#aaa", textAlign:"center", letterSpacing:"0.3px" }}>
              {SPEECH_SUPPORTED
                ? `Tip: Click "Speak" → dictate details → "Stop Recording" → Generate`
                : "Results may need minor adjustments after generation"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}