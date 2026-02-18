import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  useUser,
  useAuth,
  useClerk,
} from "@clerk/clerk-react";
import logo from "../assets/logo.png";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const clerk = useClerk();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) {
        localStorage.removeItem("token");
        return;
      }
      const token = await getToken();
      if (token) localStorage.setItem("token", token);
    };
    sync();
  }, [isSignedIn, getToken]);

  useEffect(() => {
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const displayName =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  const avatarUrl = user?.imageUrl;

  const openSignIn = () =>
    clerk?.openSignIn ? clerk.openSignIn() : navigate("/login");

  const openSignUp = () =>
    clerk?.openSignUp ? clerk.openSignUp() : navigate("/signup");

  return (
    <>
      <style>{`
        .nav-link-hover {
          transition: all 0.3s ease;
        }
        .nav-link-hover:hover {
          background: #000;
          color: #fff;
          transform: translateY(-2px);
        }

        .auth-button-hover {
          transition: all 0.3s ease;
        }
        .auth-button-hover:hover {
          background: #000;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .auth-button-hover:active {
          transform: translateY(0);
        }

        .profile-dropdown {
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Nav logo ── */
        .nav-logo {
          width: 180px;
          height: 60px;
        }

        /* ── Center nav (Features / Pricing) ── */
        .center-nav {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.5);
          padding: 4px;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }

        /* ── Auth buttons wrapper ── */
        .nav-auth {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 200px;
          justify-content: flex-end;
        }

        /* ── Auth button label ── */
        .auth-btn-label { display: inline; }

        /* ── Tablet: hide center nav ── */
        @media (max-width: 1024px) {
          .center-nav { display: none !important; }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .nav-logo {
            width: 120px;
            height: 40px;
          }

          .nav-auth {
            min-width: unset;
            gap: 8px;
          }

          /* Tighter auth buttons on mobile */
          .auth-btn {
            padding: 10px 14px !important;
            font-size: 10px !important;
          }

          /* Always show the label */
          .auth-btn-label { display: inline !important; }
        }
      `}</style>

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          background: "rgba(235, 232, 224, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 80,
            }}
          >
            {/* Logo */}
            <Link to="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <img
                src={logo}
                alt="Bill Desk Logo"
                className="nav-logo"
              />
            </Link>

            {/* Features & Pricing */}
            <div className="center-nav">
              <a href="#features" className="nav-link-hover" style={navLinkStyle}>
                FEATURES
              </a>
              <a href="#pricing" className="nav-link-hover" style={navLinkStyle}>
                PRICING
              </a>
            </div>

            {/* Auth */}
            <div className="nav-auth">
              <SignedOut>
                <button
                  onClick={openSignIn}
                  style={authButtonStyle}
                  className="auth-button-hover auth-btn"
                >
                  <span style={{ fontSize: 10, marginRight: 6 }}>▸</span>
                  <span className="auth-btn-label">LOGIN</span>
                </button>

                <button
                  onClick={openSignUp}
                  style={authButtonStyle}
                  className="auth-button-hover auth-btn"
                >
                  <span style={{ fontSize: 10, marginRight: 6 }}>▸</span>
                  <span className="auth-btn-label">SIGN UP</span>
                </button>
              </SignedOut>

              <SignedIn>
                <div
                  ref={profileRef}
                  style={{ position: "relative", display: "flex", alignItems: "center" }}
                >
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    style={{
                      background: "transparent",
                      border: "2px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: 4,
                      padding: 2,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#000";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        style={{ width: 36, height: 36, borderRadius: 2, display: "block" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#000",
                          color: "#fff",
                          fontFamily: "'Courier New', Courier, monospace",
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div
                      className="profile-dropdown"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 12px)",
                        right: 0,
                        minWidth: 200,
                        background: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: 4,
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                        overflow: "hidden",
                        zIndex: 9999,
                      }}
                    >
                      {/* User info */}
                      <div style={{ padding: 16, borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}>
                        <div
                          style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            color: "#000",
                            marginBottom: 4,
                            textTransform: "uppercase",
                          }}
                        >
                          {displayName}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", wordBreak: "break-word" }}>
                          {user?.primaryEmailAddress?.emailAddress}
                        </div>
                      </div>

                      {/* Menu items */}
                      <div style={{ padding: 8 }}>
                        <Link
                          to="/app/create-invoice"
                          onClick={() => setProfileOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: 12,
                            fontSize: 13,
                            color: "#333",
                            textDecoration: "none",
                            borderRadius: 4,
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#000";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#333";
                          }}
                        >
                          <span style={{ fontSize: 10 }}>▸</span>
                          Dashboard
                        </Link>

                        <button
                          onClick={() => {
                            clerk.signOut();
                            setProfileOpen(false);
                            navigate("/");
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: 12,
                            fontSize: 13,
                            color: "#333",
                            background: "transparent",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#000";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#333";
                          }}
                        >
                          <span style={{ fontSize: 10 }}>▸</span>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SignedIn>
            </div>
          </nav>
        </div>
      </header>

      {/* Spacer for fixed navbar */}
      <div style={{ height: 80 }} />
    </>
  );
}

const navLinkStyle = {
  padding: "12px 24px",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 11,
  fontWeight: 700,
  color: "#666",
  textDecoration: "none",
  borderRadius: 4,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

const authButtonStyle = {
  display: "flex",
  alignItems: "center",
  padding: "12px 24px",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 11,
  fontWeight: 700,
  color: "#fff",
  background: "#1a1a1a",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
};