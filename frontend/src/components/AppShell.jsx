import React, { useEffect, useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import logo from "../assets/logo.png";
import logo2 from "../assets/logo2.png";

export default function AppShell() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setCollapsed(false);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_collapsed", collapsed ? "true" : "false");
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn("signOut error", err);
    }
    navigate("/login");
  };

  const toggleSidebar = () => setCollapsed(!collapsed);

  const displayName = (() => {
    if (!user) return "User";
    const name = user.fullName || user.firstName || user.username || "";
    return name.trim() || (user.email || "").split?.("@")?.[0] || "User";
  })();

  const firstName = () => {
    const parts = displayName.split(" ").filter(Boolean);
    return parts.length ? parts[0] : displayName;
  };

  const initials = () => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  /* Icons */
  const DashboardIcon = ({ className = "w-5 h-5" }) => (
    <svg
      style={{ width: 20, height: 20 }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );

  const InvoiceIcon = ({ className = "w-5 h-5" }) => (
    <svg
      style={{ width: 20, height: 20 }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  const CreateIcon = ({ className = "w-5 h-5" }) => (
    <svg
      style={{ width: 20, height: 20 }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );

  const ProfileIcon = ({ className = "w-5 h-5" }) => (
    <svg
      style={{ width: 20, height: 20 }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const LogoutIcon = ({ className = "w-5 h-5" }) => (
    <svg
      style={{ width: 20, height: 20 }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  const CollapseIcon = ({ collapsed }) => (
    <svg
      style={{
        width: 16,
        height: 16,
        transition: "transform 0.3s ease",
        transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
      }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
      />
    </svg>
  );

  /* SidebarLink */
  const SidebarLink = ({ to, icon, children }) => (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 12,
        padding: collapsed ? "12px" : "12px 16px",
        borderRadius: 4,
        textDecoration: "none",
        transition: "all 0.2s ease",
        position: "relative",
        justifyContent: collapsed ? "center" : "flex-start",
        background: isActive ? "#000" : "transparent",
        color: isActive ? "#fff" : "#666",
        border: isActive ? "1px solid #000" : "1px solid transparent",
      })}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains("active")) {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)";
          e.currentTarget.style.transform = "translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!e.currentTarget.classList.contains("active")) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.transform = "translateX(0)";
        }
      }}
      onClick={() => setMobileOpen(false)}
    >
      {({ isActive }) => (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
          {!collapsed && (
            <span
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {children}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <style>{`
        @keyframes gridMove {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, 50px); }
        }
      `}</style>

      <style>{`
@media print {

  /* Hide everything */
  body * {
    visibility: hidden !important;
  }

  /* Show only invoice */
  #print-area, #print-area * {
    visibility: visible !important;
  }

  /* Reset layout issues */
  #print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  /* Remove sidebar space */
  div[style*="margin-left"] {
    margin-left: 0 !important;
  }

}
`}</style>

      

      <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(to bottom, #f5f3ed 0%, #ebe8e0 50%, #f5f3ed 100%)" }}>
        {/* Animated grid background */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.3,
          }}
        >
          <svg
            style={{ width: "100%", height: "100%", opacity: 0.5 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="appshell-grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#appshell-grid)">
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

        {/* Desktop Sidebar */}
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: collapsed ? 80 : 280,
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(10px)",
            borderRight: "1px solid rgba(0, 0, 0, 0.1)",
            transition: "width 0.3s ease",
            zIndex: 40,
            display: isMobile ? "none" : "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>
            {/* Logo */}
            <div
              style={{
                marginBottom: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",
              }}
            >
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textDecoration: "none",
                }}
              >
                <img
  src={collapsed ? logo2 : logo}
  alt="BillDesk Logo"
  style={{
    width: collapsed ? 50 : 180,
    height: collapsed ? 50 : 70,
    transition: "all 0.3s ease",
    objectFit: "contain"
  }}
/>

                {!collapsed && (
                  <div>
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
                      {/* Bill Desk */}
                    </span>
                  </div>
                )}
              </Link>

              {!collapsed && (
                <button
                  onClick={toggleSidebar}
                  style={{
                    padding: 8,
                    background: "transparent",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: 4,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#000";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#000";
                  }}
                >
                  <CollapseIcon collapsed={collapsed} />
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SidebarLink to="/app/dashboard" icon={<DashboardIcon />}>
                Dashboard
              </SidebarLink>
              <SidebarLink to="/app/invoices" icon={<InvoiceIcon />}>
                Invoices
              </SidebarLink>
              <SidebarLink to="/app/create-invoice" icon={<CreateIcon />}>
                Create Invoice
              </SidebarLink>
              <SidebarLink to="/app/business" icon={<ProfileIcon />}>
                Business Profile
              </SidebarLink>
            </nav>
          </div>

          {/* Bottom Section */}
          <div style={{ padding: 20, borderTop: "1px solid rgba(0, 0, 0, 0.1)" }}>
            {!collapsed ? (
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#dc2626",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)";
                  e.currentTarget.style.color = "#dc2626";
                }}
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "#dc2626",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)";
                  e.currentTarget.style.color = "#dc2626";
                }}
              >
                <LogoutIcon />
              </button>
            )}

            {/* Collapse button at bottom */}
            <button
              onClick={toggleSidebar}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "space-between",
                gap: 12,
                padding: collapsed ? 12 : "12px 16px",
                marginTop: 12,
                background: "transparent",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: "#666",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {!collapsed && <span>Collapse</span>}
              <CollapseIcon collapsed={collapsed} />
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
            }}
          >
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: 280,
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                display: "flex",
                flexDirection: "column",
                animation: "slideIn 0.3s ease",
              }}
            >
              {/* Mobile Header */}
              <div
                style={{
                  padding: 20,
                  borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                  }}
                >
                  <img src={logo} alt="Logo" style={{ width: 40, height: 40 }} />
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
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: 8,
                    background: "transparent",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  <svg
                    style={{ width: 20, height: 20 }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Nav */}
              <nav style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <NavLink
                  to="/app/dashboard"
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 4,
                    textDecoration: "none",
                    background: isActive ? "#000" : "transparent",
                    color: isActive ? "#fff" : "#666",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  })}
                >
                  <DashboardIcon /> Dashboard
                </NavLink>
                <NavLink
                  to="/app/invoices"
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 4,
                    textDecoration: "none",
                    background: isActive ? "#000" : "transparent",
                    color: isActive ? "#fff" : "#666",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  })}
                >
                  <InvoiceIcon /> Invoices
                </NavLink>
                <NavLink
                  to="/app/create-invoice"
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 4,
                    textDecoration: "none",
                    background: isActive ? "#000" : "transparent",
                    color: isActive ? "#fff" : "#666",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  })}
                >
                  <CreateIcon /> Create Invoice
                </NavLink>
                <NavLink
                  to="/app/business"
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 4,
                    textDecoration: "none",
                    background: isActive ? "#000" : "transparent",
                    color: isActive ? "#fff" : "#666",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  })}
                >
                  <ProfileIcon /> Business Profile
                </NavLink>
              </nav>

              {/* Mobile Logout */}
              <div style={{ padding: 20, borderTop: "1px solid rgba(0, 0, 0, 0.1)" }}>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "rgba(220, 38, 38, 0.1)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    color: "#dc2626",
                  }}
                >
                  <LogoutIcon /> Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : (collapsed ? 80 : 280),
            transition: "margin-left 0.3s ease",
            minWidth: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Header */}
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              background: scrolled ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              boxShadow: scrolled ? "0 4px 12px rgba(0, 0, 0, 0.05)" : "none",
            }}
          >
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {/* Left section */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {isMobile && (
                    <button
                      onClick={() => setMobileOpen(true)}
                      style={{
                        padding: 8,
                        background: "transparent",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      <svg
                        style={{ width: 20, height: 20 }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  )}
                  {!isMobile && (
                    <button
                      onClick={toggleSidebar}
                      style={{
                        padding: 8,
                        background: "transparent",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: 4,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CollapseIcon collapsed={collapsed} />
                    </button>
                  )}

                  <div>
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#000",
                        marginBottom: 4,
                      }}
                    >
                      Welcome back, <span style={{ color: "#666" }}>{firstName()}!</span>
                    </h2>
                    <p style={{ fontSize: 13, color: "#666" }}>
                      Ready to create amazing invoices?
                    </p>
                  </div>
                </div>

                {/* Right section */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button
                    onClick={() => navigate("/app/create-invoice")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      background: "#000",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <CreateIcon />
                    <span style={{ display: isMobile ? "none" : "inline" }}>Create Invoice</span>
                  </button>

                  {/* User Avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {!isMobile && (
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#000",
                          }}
                        >
                          {displayName}
                        </div>
                        <div style={{ fontSize: 11, color: "#666" }}>
                          {user?.primaryEmailAddress?.emailAddress}
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        background: "#000",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: 14,
                        fontWeight: 700,
                        border: "2px solid rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      {initials()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main style={{ position: "relative", zIndex: 1 }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}