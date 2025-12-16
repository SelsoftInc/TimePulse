'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_BASE } from '@/config/api';
import "./Settings.css";
import "./BillingSettings.css";

const BillingSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingPlan, setBillingPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [seats, setSeats] = useState(1);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 1.99,
      period: "user/month",
      description: "Perfect for small teams getting started",
      maxSeats: 10,
      canUpgradeTo: ["professional", "enterprise"],
      features: [
        "Up to 10 users",
        "AI-powered uploads",
        "MSA/SOW mapping",
        "Auto invoicing to QuickBooks/NetSuite",
        "1-level approval workflow",
        "Basic timesheet digitization",
        "Email support",
      ]},
    {
      id: "professional",
      name: "Professional",
      price: 3.99,
      period: "user/month",
      description: "Advanced automation for growing teams",
      badge: "Most Popular",
      maxSeats: 50,
      canUpgradeTo: ["enterprise"],
      features: [
        "Up to 50 users",
        "Everything in Starter",
        "Multi-level approvals",
        "Real-time analytics dashboard",
        "Integrations",
        "Priority support",
      ]},
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "Tailored solutions for large organizations",
      maxSeats: 999,
      canUpgradeTo: [],
      features: [
        "Unlimited users",
        "Everything in Professional",
        "Custom API integrations",
        "SLA support",
        "Dedicated account manager",
        "Advanced security features",
      ]},
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
              Authorization: `Bearer ${token}`}}
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

  const handlePlanChange = async (planId, seatCount = seats) => {
    if (planId === billingPlan) return;

    console.log("handlePlanChange called with:", planId, "seats:", seatCount);
    console.log("Current subscription:", subscription);

    // Check if this is a downgrade (not allowed)
    const currentPlan = plans.find(p => p.id === billingPlan);
    const newPlan = plans.find(p => p.id === planId);
    
    if (currentPlan && newPlan) {
      const planOrder = { starter: 1, professional: 2, enterprise: 3 };
      if (planOrder[planId] < planOrder[billingPlan]) {
        toast.error("Downgrades are not supported. Please contact support.");
        return;
      }
    }

    // If no subscription exists, start checkout
    if (!subscription || !subscription.stripeSubscriptionId || subscription.status === "none" || subscription.status === "inactive") {
      console.log("No active subscription, starting checkout...");
      await startCheckout(planId, "monthly", seatCount);
      return;
    }

    // User has active subscription, so change the plan
    console.log("Active subscription found, changing plan...");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/billing/change-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          tenantId: user.tenantId,
          plan: planId,
          interval: "monthly"})});

      if (response.ok) {
        setBillingPlan(planId);
        toast.success("Subscription plan updated successfully");
        // Refresh subscription data
        const statusResponse = await fetch(
          `${API_BASE}/api/billing/status?tenantId=${user.tenantId}`,
          {
            headers: { Authorization: `Bearer ${token}` }}
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
  const startCheckout = async (plan, interval, seatCount = 1) => {
    try {
      console.log("Starting checkout for:", { plan, interval, seats: seatCount, user });
      
      if (!user || !user.tenantId || !user.email) {
        toast.error("User information not available. Please log in again.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please log in.");
        return;
      }

      console.log("Making API call to:", `${API_BASE}/api/billing/checkout`);
      
      const response = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          tenantId: user.tenantId,
          email: user.email,
          plan,
          interval,
          seats: seatCount})});

      console.log("API Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Checkout URL:", data.url);
        window.location.href = data.url;
      } else {
        const error = await response.json();
        console.error("Checkout error:", error);
        toast.error(error.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast.error("Failed to start checkout: " + error.message);
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
          Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          tenantId: user.tenantId})});

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
            style={{ cursor: plan.id === billingPlan ? "default" : "auto" }}
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
            
            {plan.id !== "enterprise" && plan.id !== billingPlan && (
              <div className="seat-selector" style={{ padding: "0 20px 15px", borderTop: "1px solid #e5e7eb", marginTop: "15px", paddingTop: "15px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#374151" }}>
                  Number of Users
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (seats > 1) setSeats(seats - 1);
                    }}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      background: "white",
                      cursor: seats > 1 ? "pointer" : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}
                    disabled={seats <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={plan.maxSeats}
                    value={seats}
                    onChange={(e) => {
                      e.stopPropagation();
                      const val = parseInt(e.target.value) || 1;
                      setSeats(Math.min(Math.max(1, val), plan.maxSeats));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "80px",
                      padding: "8px",
                      textAlign: "center",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "16px"
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (seats < plan.maxSeats) setSeats(seats + 1);
                    }}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      background: "white",
                      cursor: seats < plan.maxSeats ? "pointer" : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}
                    disabled={seats >= plan.maxSeats}
                  >
                    +
                  </button>
                  <span style={{ marginLeft: "auto", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                    {typeof plan.price === 'number' ? `$${(plan.price * seats).toFixed(2)}/month` : 'Custom'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="plan-action">
              {plan.id === billingPlan ? (
                <button className="plan-btn current" disabled>
                  Current Plan
                </button>
              ) : plan.id === "enterprise" ? (
                <button
                  className="plan-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = "mailto:sales@timepulse.com";
                  }}
                >
                  Contact Sales
                </button>
              ) : (
                <>
                  {billingPlan && plans.find(p => p.id === billingPlan) && 
                   plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === billingPlan) ? (
                    <button className="plan-btn" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                      Downgrade Not Available
                    </button>
                  ) : (
                    <button
                      className="plan-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Button clicked for plan:", plan.id, "seats:", seats);
                        console.log("User:", user);
                        !loading && handlePlanChange(plan.id, seats);
                      }}
                      disabled={loading}
                    >
                      {billingPlan ? 'Upgrade Plan' : 'Start Free Trial'}
                    </button>
                  )}
                </>
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