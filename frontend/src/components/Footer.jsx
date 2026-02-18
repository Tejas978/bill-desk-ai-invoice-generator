import React from "react";
import logo from "../assets/logo2.png";
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @keyframes gridMove {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, 50px); }
        }

        .footer-inner {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 24px;
          z-index: 2;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 48px;
          margin-bottom: 64px;
        }

        .footer-bottom {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .footer-legal-links {
          display: flex;
          gap: 32px;
        }

        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 36px;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .footer-inner {
            padding: 56px 20px 48px;
          }

          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 36px 24px;
            margin-bottom: 40px;
          }

          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .footer-legal-links {
            gap: 20px;
          }
        }

        /* ── Very small ── */
        @media (max-width: 400px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
      `}</style>

      <footer
        style={{
          position: "relative",
          background: "linear-gradient(to bottom, #f5f3ed 0%, #ebe8e0 100%)",
          borderTop: "1px solid rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Animated grid background */}
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
          <svg style={{ width: "100%", height: "100%", opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="footer-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#footer-grid)">
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

        <div className="footer-inner">
          {/* Top Section */}
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                    backgroundColor: "",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden", // important
                  }}
                >
                  <img
                    src={logo}
                    alt="Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain", // keeps logo ratio
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#000",
                  }}
                >
                  Bill Desk
                </span>
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#666", maxWidth: 280 }}>
                Smart invoicing platform built for freelancers and growing businesses. Simple, fast, and professional.
              </p>

              <div style={{ width: 60, height: 2, backgroundColor: "#000", marginTop: 20 }} />
            </div>

            {/* Product */}
            <div>
              <h4 style={colHeadStyle}>Product</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                  <li key={item} style={{ listStyle: "none" }}>
                    <a href="#" style={linkStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#000"; e.currentTarget.style.transform = "translateX(4px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.transform = "translateX(0)"; }}
                    >
                      <span style={{ fontSize: 10 }}>▸</span>{item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 style={colHeadStyle}>Resources</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["Documentation", "API Reference", "Blog", "Community"].map((item) => (
                  <li key={item} style={{ listStyle: "none" }}>
                    <a href="#" style={linkStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#000"; e.currentTarget.style.transform = "translateX(4px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.transform = "translateX(0)"; }}
                    >
                      <span style={{ fontSize: 10 }}>▸</span>{item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 style={colHeadStyle}>Company</h4>
              <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["About", "Careers", "Contact", "Partners"].map((item) => (
                  <li key={item} style={{ listStyle: "none" }}>
                    <a href="#" style={linkStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#000"; e.currentTarget.style.transform = "translateX(4px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.transform = "translateX(0)"; }}
                    >
                      <span style={{ fontSize: 10 }}>▸</span>{item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: 1, backgroundColor: "rgba(0, 0, 0, 0.1)", marginBottom: 32 }} />

          {/* Bottom Section */}
          <div className="footer-bottom">
            <div
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                color: "#666",
                letterSpacing: "0.5px",
              }}
            >
              © {currentYear} BILL DESK. ALL RIGHTS RESERVED.
            </div>

            <div className="footer-legal-links">
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 12,
                    color: "#666",
                    textDecoration: "none",
                    letterSpacing: "0.5px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#000"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; }}
                >
                  {item.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Technical badge */}
          <div
            style={{
              marginTop: 48,
              padding: 20,
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              borderRadius: 4,
              border: "1px solid rgba(0, 0, 0, 0.08)",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                color: "#666",
                letterSpacing: "0.5px",
                margin: 0,
              }}
            >
              BUILT WITH PRECISION • AUTOMATION MADE PROFESSIONAL • DESIGNED FOR PROFESSIONALS
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

const colHeadStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#000",
  marginBottom: 20,
};

const linkStyle = {
  fontSize: 14,
  color: "#666",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "all 0.3s ease",
};