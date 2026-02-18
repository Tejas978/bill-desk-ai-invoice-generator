import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";

export default function Hero() {
  const navigate = useNavigate();
  const clerk = useClerk();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignedInPrimary = () => {
    navigate("/app/create-invoice");
  };

  const handleSignedOutPrimary = () => {
    try {
      if (clerk && typeof clerk.openSignUp === "function") {
        clerk.openSignUp();
      }
    } catch (err) {
      console.error("Failed to open Clerk sign up modal:", err);
    }
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        @keyframes rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* ── Responsive overrides ── */

        .hero-section {
        
          position: relative;
          min-height: 100vh;
          background: linear-gradient(to bottom, #ebe8e0 0%, #f5f3ed 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 20px 80px;
        }

        .hero-container {
        margin-top: -50px;  
          position: relative;
          z-index: 2;
          max-width: 1200px;
          width: 100%;
          text-align: center;
          margin-top: -84px;
        }

        .hero-news-banner {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background-color: #f4d9c6;
          padding: 12px 24px;
          margin-bottom: 60px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .hero-title {
          font-size: clamp(48px, 8vw, 96px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -2px;
          color: #000;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-transform: uppercase;
        }

        .hero-subtitle {
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.6;
          color: #333;
          max-width: 700px;
          margin: 0 auto;
        }

        .hero-cta-container {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          margin-top: 16px;
        }

        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background-color: #1a1a1a;
          color: #fff;
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          text-transform: uppercase;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .hero-btn-primary:hover {
          background-color: #000;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        .hero-btn-primary:active {
          transform: translateY(0);
        }

        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background-color: transparent;
          color: #000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          border: 1px solid #000;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
          text-transform: uppercase;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .hero-btn-secondary:hover {
          background-color: rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }
        .hero-btn-secondary:active {
          transform: translateY(0);
        }

        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 32px;
          margin-top: 48px;
          padding: 32px;
          background-color: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .hero-stat-item {
          text-align: center;
          min-width: 200px;
        }

        .hero-stat-value {
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #000;
          margin-bottom: 8px;
        }

        .hero-stat-label {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
        }

        .hero-stat-divider {
          width: 1px;
          height: 40px;
          background-color: rgba(0, 0, 0, 0.1);
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .hero-section {
            padding: 10px 20px 80px;
            align-items: flex-start;
            min-height: 100svh;
          }

          .hero-container {
            margin-top: 0;
          }

          .hero-news-banner {
            font-size: 9px;
            padding: 9px 14px;
            gap: 8px;
            margin-bottom: 36px;
            max-width: 100%;
            white-space: normal;
            text-align: center;
          }

          .hero-title {
            letter-spacing: -1px;
            gap: 4px;
          }

          .hero-subtitle {
            font-size: 14px;
          }

          .hero-cta-container {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .hero-btn-primary,
          .hero-btn-secondary {
            width: 100%;
            justify-content: center;
            padding: 16px 24px;
          }

          .hero-stats {
            flex-direction: column;
            gap: 0;
            padding: 0;
            margin-top: 36px;
          }

          .hero-stat-item {
            min-width: unset;
            width: 100%;
            padding: 20px 24px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          }

          .hero-stat-item:last-child {
            border-bottom: none;
          }

          .hero-stat-divider {
            display: none;
          }
        }

        /* ── Tablet ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-stat-item {
            min-width: 140px;
          }

          .hero-stats {
            gap: 20px;
            padding: 24px;
          }
        }
      `}</style>

      <section className="hero-section">
        {/* Geometric grid background */}
        <div style={styles.heroBg}>
          <svg
            style={styles.gridSvg}
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2.5" />
              </pattern>
              <radialGradient id="fade">
                <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)">
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="50 50"
                dur="20s"
                repeatCount="indefinite"
              />
            </rect>
            <rect width="100%" height="100%" fill="url(#fade)" />
          </svg>
        </div>

        <div className="hero-container">
          {/* News Banner */}
          <div className="hero-news-banner">
            <span style={styles.newsArrow}>▸</span>
            <span style={styles.newsText}>
              NEWS: BILL DESK — FAST, INTELLIGENT, AI-POWERED INVOICE GENERATION
            </span>
            <span style={styles.newsArrow}>◂</span>
          </div>

          {/* Main Content */}
          <div style={styles.content}>
            {/* Main Heading */}
            <h1 className="hero-title">
              <span>PROFESSIONAL</span>
              <span>INVOICE GENERATION</span>
              <span>FOR AI AGE</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle">
              Transform conversations into professional invoices with AI intelligence.
              <br />
              Create, manage, and send invoices in seconds - scale across all your clients.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta-container">
              <SignedIn>
                <button
                  type="button"
                  onClick={handleSignedInPrimary}
                  className="hero-btn-primary"
                >
                  <span>▸</span>
                  <span>GET STARTED</span>
                </button>
              </SignedIn>

              <SignedOut>
                <button
                  type="button"
                  onClick={handleSignedOutPrimary}
                  className="hero-btn-primary"
                >
                  <span>▸</span>
                  <span>GET STARTED</span>
                </button>
              </SignedOut>

              <a href="#features" className="hero-btn-secondary">
                <span>▸</span>
                <span>VIEW FEATURES</span>
                <span>◂</span>
              </a>
            </div>

            {/* Feature Stats */}
            <div className="hero-stats">
              <div className="hero-stat-item">
                <div className="hero-stat-value">AI-POWERED</div>
                <div className="hero-stat-label">Smart text parsing & extraction</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <div className="hero-stat-value">INSTANT</div>
                <div className="hero-stat-label">Generate invoices in seconds</div>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <div className="hero-stat-value">PROFESSIONAL</div>
                <div className="hero-stat-label">Branded templates & automation</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const styles = {
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1,
  },
  gridSvg: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  newsArrow: {
    color: '#000',
    fontSize: '12px',
  },
  newsText: {
    color: '#000',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
  },
};