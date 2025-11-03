import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { API_BASE } from "../../config/api";
import "./Settings.css";
import "./BillingSettings.css";

const BillingSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingPlan, setBillingPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 1.99,
      period: "user/month",
      description: "Perfect for small teams getting started",
      features: [
        "AI-powered uploads",
        "MSA/SOW mapping",
        "Auto invoicing to QuickBooks/NetSuite",
        "1-level approval workflow",
        "Basic timesheet digitization",
        "Email support",
      ],
    },
    {
      id: "professional",
      name: "Professional",
      price: 3.99,
      period: "user/month",
      description: "Advanced automation for growing teams",
      badge: "Most Popular",
      features: [
        "Everything in Starter",
        "Multi-level approvals",
        "Real-time analytics dashboard",
        "Priority support",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "Tailored solutions for large organizations",
      features: [
        "Everything in Professional",
        "Custom API integrations",
        "SLA support",
        "Dedicated account manager",
        "Advanced security features",
      ],
    },
  ];

  // Format price display
  const formatPrice = (price) => {
    if (typeof price === "string") return price;
    return `$${price.toFixed(2)}`;
  };

  // Mock payment methods
  const paymentMethods = [
    { id: "credit_card", last4: "4242", brand: "Visa", expiry: "12/26" },
  ];

  // Fetch current subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.tenantId) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE}/api/billing/status?tenantId=${user.tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
          if (data.plan && data.plan !== "none") {
            setBillingPlan(data.plan);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
  }, [user?.tenantId]);

  const handlePlanChange = async (planId) => {
    if (planId === billingPlan) return;

    // If no subscription exists, start checkout
    if (!subscription || subscription.status === "none") {
      await startCheckout(planId, "monthly");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/billing/change-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: user.tenantId,
          plan: planId,
          interval: "monthly",
        }),
      });

      if (response.ok) {
        setBillingPlan(planId);
        toast.success("Subscription plan updated successfully");
        // Refresh subscription data
        const statusResponse = await fetch(
          `${API_BASE}/api/billing/status?tenantId=${user.tenantId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          setSubscription(data);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update subscription plan");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription plan");
    } finally {
      setLoading(false);
    }
  };

  // Start Stripe checkout for new subscriptions
  const startCheckout = async (plan, interval) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: user.tenantId,
          email: user.email,
          plan,
          interval,
          seats: 1, // Default to 1 seat, can be made configurable
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast.error("Failed to start checkout");
    }
  };

  // Open Stripe customer portal
  const openPortal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/billing/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: user.tenantId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to open billing portal");
      }
    } catch (error) {
      console.error("Error opening portal:", error);
      toast.error("Failed to open billing portal");
    }
  };

  return (
    <div className="billing-setting">
      <div className="billing-header">
        <h1 className="billing-title">Billing & Subscription</h1>
        <div className="current-plan-section">
          <span className="current-plan-label">Current Plan</span>
          {subscription && subscription.status !== "none" && (
            <button
              className="manage-billing-btn"
              onClick={openPortal}
              disabled={loading}
            >
              <i className="fas fa-cog"></i>
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="pricing-plans">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${
              plan.id === billingPlan ? "current-plan" : ""
            } ${plan.id === "professional" && plan.id !== billingPlan ? "featured-plan" : ""} ${
              loading ? "loading" : ""
            }`}
            onClick={() => plan.id !== billingPlan && !loading && handlePlanChange(plan.id)}
            style={{ cursor: plan.id === billingPlan ? "default" : "pointer" }}
          >
            {plan.badge && plan.id !== billingPlan && (
              <div className="plan-badge">{plan.badge}</div>
            )}
            {plan.id === billingPlan && (
              <div className="current-plan-badge">CURRENT PLAN</div>
            )}
            
            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price-amount">{formatPrice(plan.price)}</span>
                <span className="price-period">/{plan.period}</span>
              </div>
              <p className="plan-description">{plan.description}</p>
            </div>
            
            <div className="plan-features">
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <svg
                      className="check-icon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <span className="feature-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="plan-action">
              {plan.id === billingPlan ? (
                <button className="plan-btn current" disabled>
                  Current Plan
                </button>
              ) : plan.id === "enterprise" ? (
                <button
                  className="plan-btn"
                  onClick={() => window.location.href = "mailto:sales@timepulse.com"}
                >
                  Contact Sales
                </button>
              ) : (
                <button
                  className="plan-btn"
                  onClick={() => !loading && handlePlanChange(plan.id)}
                  disabled={loading}
                >
                  Start Free Trial
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="payment-methods-section">
        <h3 className="section-title">Payment Methods</h3>
        <div className="payment-methods">
          {paymentMethods.map((method) => (
            <div key={method.id} className="payment-method-card">
              <div className="payment-icon">
                {method.brand === "Visa" && <i className="fab fa-cc-visa"></i>}
                {method.brand === "Mastercard" && (
                  <i className="fab fa-cc-mastercard"></i>
                )}
                {method.brand === "Amex" && <i className="fab fa-cc-amex"></i>}
              </div>
              <div className="payment-details">
                <div className="payment-name">
                  {method.brand} ending in {method.last4}
                </div>
                <div className="payment-expiry">Expires {method.expiry}</div>
              </div>
              <div className="payment-actions">
                <button className="btn btn-sm btn-outline-primary">Edit</button>
              </div>
            </div>
          ))}
          <button className="btn btn-primary add-payment-btn">
            <i className="fas fa-plus mr-1"></i> Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;