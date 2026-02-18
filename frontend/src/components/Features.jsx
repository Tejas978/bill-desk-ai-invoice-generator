import React, { useState, useEffect, useRef } from "react";

const FeatureCard = ({ title, desc, icon, delay = 0, index }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "rgba(255, 255, 255, 0.6)",
        borderRadius: 4,
        padding: 40,
        border: isHovered ? "2px solid #000" : "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: isHovered
          ? "0 8px 24px rgba(0, 0, 0, 0.12)"
          : "0 2px 8px rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s ease",
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        opacity: isVisible ? 1 : 0,
        cursor: "pointer",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Geometric corner decoration */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 60,
          height: 60,
          background: isHovered ? "#000" : "rgba(0, 0, 0, 0.05)",
          transition: "all 0.3s ease",
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Icon container */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 4,
            background: isHovered ? "#000" : "rgba(0, 0, 0, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            transition: "all 0.3s ease",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: 0.15,
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`grid-${index}`}
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke={isHovered ? "#fff" : "#000"}
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
          </svg>

          <div
            style={{
              color: isHovered ? "#fff" : "#000",
              transition: "color 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Content */}
        <div>
          <h4
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 16,
              fontWeight: 700,
              color: "#000",
              marginBottom: 16,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {title}
          </h4>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#333",
              marginBottom: 24,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {desc}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 12,
              fontWeight: 600,
              color: "#000",
              letterSpacing: "0.5px",
            }}
          >
            <span>▸</span>
            <span
              style={{
                transform: isHovered ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.3s ease",
              }}
            >
              LEARN MORE
            </span>
          </div>
        </div>
      </div>

      {/* Bottom line decoration */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: isHovered ? "100%" : "0%",
          height: 2,
          backgroundColor: "#000",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
};

export default function Features() {
  const [titleVisible, setTitleVisible] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTitleVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (titleRef.current) {
      observer.observe(titleRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: "AI Invoice Parsing",
      desc: "Paste freeform text and let our advanced AI extract client details, line items, and totals into a perfectly formatted draft invoice in seconds.",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="12" y1="9" x2="8" y2="9" />
        </svg>
      ),
    },
    {
      title: "Smart Email Reminders",
      desc: "Generate professional, context-aware reminder emails with one click — complete with intelligent tone selection and personalized messaging.",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      title: "Professional PDF Export",
      desc: "Generate high-quality, brand-consistent PDF invoices with reliable email delivery and comprehensive tracking of all sent communications.",
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gridMove {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, 50px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* ── Features layout ── */

        .features-section {
          position: relative;
          padding: 120px 24px;
          background: linear-gradient(to bottom, #f5f3ed 0%, #ebe8e0 50%, #f5f3ed 100%);
          overflow: hidden;
        }

        .features-inner {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          z-index: 2;
        }

        .features-header {
          text-align: center;
          margin: 0 auto 80px;
          max-width: 900px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 80px;
        }

        /* ── Tablet ── */
        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .features-section {
            padding: 72px 20px 64px;
          }

          .features-header {
            margin-bottom: 48px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-bottom: 48px;
          }

          /* Tighten card padding on mobile */
          .features-grid > * {
            padding: 28px 24px !important;
          }
        }
      `}</style>

      <section id="features" className="features-section">
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
            opacity: 0.4,
          }}
        >
          <svg style={{ width: "100%", height: "100%", opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="features-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
              </pattern>
              <radialGradient id="features-fade">
                <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#features-grid)">
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="50 50"
                dur="20s"
                repeatCount="indefinite"
              />
            </rect>
            <rect width="100%" height="100%" fill="url(#features-fade)" />
          </svg>
        </div>

        {/* Floating shape */}
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            right: "12%",
            width: 150,
            height: 150,
            border: "1px solid rgba(0, 0, 0, 0.06)",
            borderRadius: "50%",
            animation: "float 18s ease-in-out infinite reverse",
            pointerEvents: "none",
          }}
        />

        <div className="features-inner">
          {/* Header */}
          <div ref={titleRef} className="features-header">
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 24px",
                backgroundColor: "#f4d9c6",
                borderRadius: 4,
                marginBottom: 32,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.5px",
                opacity: titleVisible ? 1 : 0,
                transform: titleVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              <span style={{ color: "#000" }}>▸</span>
              <span style={{ color: "#000" }}>CORE FEATURES</span>
              <span style={{ color: "#000" }}>◂</span>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "clamp(40px, 6vw, 72px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-2px",
                marginBottom: 24,
                color: "#000",
                opacity: titleVisible ? 1 : 0,
                transform: titleVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease 0.1s",
                textTransform: "uppercase",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span>INTELLIGENT</span>
              <span>AUTOMATION</span>
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(15px, 2vw, 18px)",
                lineHeight: 1.7,
                color: "#333",
                maxWidth: 700,
                margin: "0 auto",
                opacity: titleVisible ? 1 : 0,
                transform: titleVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease 0.2s",
              }}
            >
              Purpose-built tools that transform manual invoice workflows into
              streamlined, AI-powered processes. Create, manage, and deliver
              professional invoices with precision.
            </p>

            {/* Decorative line */}
            <div
              style={{
                width: 100,
                height: 3,
                backgroundColor: "#000",
                margin: "32px auto 0",
                opacity: titleVisible ? 1 : 0,
                transition: "all 0.6s ease 0.3s",
              }}
            />
          </div>

          {/* Cards grid */}
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                desc={feature.desc}
                icon={feature.icon}
                delay={index * 150}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}