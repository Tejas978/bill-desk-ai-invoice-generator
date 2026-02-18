import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerk, useAuth } from "@clerk/clerk-react";

const PricingCard = ({
  title,
  price,
  period,
  description,
  features,
  isPopular,
  onCtaClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: 40,
        borderRadius: 4,
        transition: "all 0.3s ease",
        background: isPopular ? "#000" : "rgba(255, 255, 255, 0.6)",
        border: isPopular ? "2px solid #000" : isHovered ? "2px solid #000" : "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: isHovered
          ? "0 8px 24px rgba(0, 0, 0, 0.12)"
          : "0 2px 8px rgba(0, 0, 0, 0.04)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#f4d9c6",
            color: "#000",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.5px",
            padding: "6px 16px",
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          RECOMMENDED
        </div>
      )}

      {/* Geometric corner decoration */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 60,
          height: 60,
          background: isPopular ? "rgba(255, 255, 255, 0.1)" : isHovered ? "#000" : "rgba(0, 0, 0, 0.05)",
          transition: "all 0.3s ease",
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Title */}
        <h3
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: 12,
            color: isPopular ? "#fff" : "#000",
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 24,
            color: isPopular ? "rgba(255, 255, 255, 0.8)" : "#666",
          }}
        >
          {description}
        </p>

        {/* Price */}
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: "-2px",
              color: isPopular ? "#fff" : "#000",
            }}
          >
            {price}
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 14,
              color: isPopular ? "rgba(255, 255, 255, 0.7)" : "#666",
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            /{period}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            backgroundColor: isPopular ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            marginBottom: 24,
          }}
        />

        {/* Features */}
        <ul style={{ marginBottom: 32, flex: 1 }}>
          {features.map((feature, index) => (
            <li
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 12,
                color: isPopular ? "#fff" : "#333",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: isPopular ? "#fff" : "#000",
                }}
              >
                ▸
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => onCtaClick(title)}
          style={{
            width: "100%",
            padding: "16px 32px",
            backgroundColor: isPopular ? "#fff" : "#000",
            color: isPopular ? "#000" : "#fff",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
          }}
        >
          Get Started
        </button>
      </div>

      {/* Bottom line decoration */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: isHovered ? "100%" : "0%",
          height: 2,
          backgroundColor: isPopular ? "#fff" : "#000",
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
};

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const plans = {
    monthly: [
      {
        title: "Starter",
        price: "₹0",
        period: "month",
        description: "Perfect for freelancers and small projects",
        features: [
          "5 invoices per month",
          "Standard templates",
          "Email support",
          "PDF export",
        ],
      },
      {
        title: "Professional",
        price: "₹499",
        period: "month",
        description: "For growing businesses and agencies",
        features: [
          "Unlimited invoices",
          "Custom branding",
          "Advanced analytics",
          "Priority support",
        ],
        isPopular: true,
      },
      {
        title: "Enterprise",
        price: "₹1,499",
        period: "month",
        description: "For large organizations",
        features: [
          "Unlimited team members",
          "Custom workflows",
          "Dedicated support",
          "Enterprise security",
        ],
      },
    ],
    annual: [
      {
        title: "Starter",
        price: "₹0",
        period: "month",
        description: "Perfect for freelancers and small projects",
        features: [
          "5 invoices per month",
          "Standard templates",
          "Email support",
          "PDF export",
        ],
      },
      {
        title: "Professional",
        price: "₹399",
        period: "month",
        description: "For growing businesses and agencies",
        features: [
          "Unlimited invoices",
          "Custom branding",
          "Advanced analytics",
          "Priority support",
        ],
        isPopular: true,
      },
      {
        title: "Enterprise",
        price: "₹1,199",
        period: "month",
        description: "For large organizations",
        features: [
          "Unlimited team members",
          "Custom workflows",
          "Dedicated support",
          "Enterprise security",
        ],
      },
    ],
  };

  function handleCtaClick(planTitle) {
    if (!isSignedIn) {
      clerk.openSignIn({
        redirectUrl: "/app/create-invoice",
      });
      return;
    }

    navigate("/app/create-invoice", {
      state: { fromPlan: planTitle },
    });
  }

  return (
    <>
      <style>{`
        @keyframes gridMove {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, 50px); }
        }
      `}</style>

      <section
      id="pricing"
        style={{
          position: "relative",
          padding: "120px 24px",
          background: "linear-gradient(to bottom, #ebe8e0 0%, #f5f3ed 50%, #ebe8e0 100%)",
          overflow: "hidden",
        }}
      >
        {/* Animated grid background - matching Hero */}
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
          <svg
            style={{ width: "100%", height: "100%", opacity: 0.5 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="pricing-grid"
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
              <radialGradient id="pricing-fade">
                <stop offset="0%" stopColor="rgba(0,0,0,0.1)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#pricing-grid)">
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="50 50"
                dur="20s"
                repeatCount="indefinite"
              />
            </rect>
            <rect width="100%" height="100%" fill="url(#pricing-fade)" />
          </svg>
        </div>

        <div
          style={{
            position: "relative",
            maxWidth: 1280,
            margin: "0 auto",
            zIndex: 2,
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 80,
              maxWidth: 900,
              margin: "0 auto 80px",
            }}
          >
            {/* Technical badge */}
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
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              <span style={{ color: "#000" }}>▸</span>
              <span style={{ color: "#000" }}>PRICING PLANS</span>
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
                textTransform: "uppercase",
              }}
            >
              SIMPLE, TRANSPARENT PRICING
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: 1.7,
                color: "#333",
                maxWidth: 700,
                margin: "0 auto 40px",
              }}
            >
              Start free. Scale as you grow. No hidden fees.
            </p>

            {/* Decorative line */}
            <div
              style={{
                width: 100,
                height: 3,
                backgroundColor: "#000",
                margin: "0 auto 40px",
              }}
            />

            {/* Monthly / Annual Toggle */}
            <div
              style={{
                display: "inline-flex",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                padding: 4,
                borderRadius: 4,
                border: "1px solid rgba(0, 0, 0, 0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <button
                onClick={() => setBillingPeriod("monthly")}
                style={{
                  padding: "12px 32px",
                  borderRadius: 4,
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: billingPeriod === "monthly" ? "#000" : "transparent",
                  color: billingPeriod === "monthly" ? "#fff" : "#666",
                }}
              >
                Monthly
              </button>

              <button
                onClick={() => setBillingPeriod("annual")}
                style={{
                  padding: "12px 32px",
                  borderRadius: 4,
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: billingPeriod === "annual" ? "#000" : "transparent",
                  color: billingPeriod === "annual" ? "#fff" : "#666",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Annual
                <span
                  style={{
                    fontSize: 9,
                    backgroundColor: "#f4d9c6",
                    color: "#000",
                    padding: "4px 8px",
                    borderRadius: 2,
                    fontWeight: 700,
                  }}
                >
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 32,
              maxWidth: 1200,
              margin: "0 auto",
            }}
          >
            {plans[billingPeriod].map((plan, index) => (
              <PricingCard
                key={index}
                {...plan}
                onCtaClick={handleCtaClick}
              />
            ))}
          </div>

          {/* Footer note */}
          <div
            style={{
              textAlign: "center",
              marginTop: 64,
              padding: 24,
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              borderRadius: 4,
              border: "1px solid rgba(0, 0, 0, 0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <p
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                color: "#666",
                letterSpacing: "0.5px",
              }}
            >
              ALL PLANS INCLUDE: PDF EXPORT • EMAIL SUPPORT • SECURE PAYMENT • 14-DAY REFUND
            </p>
          </div>
        </div>
      </section>
    </>
  );
}