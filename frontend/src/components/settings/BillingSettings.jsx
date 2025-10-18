import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { API_BASE } from "../../config/api";
import "./Settings.css";
import "./BillingSettings.css";

const BillingSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [billingPlan, setBillingPlan] = useState("professional");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 49,
      users: 5,
      features: ["Basic time tracking", "Project management", "Invoicing"],
    },
    {
      id: "professional",
      name: "Professional",
      price: 99,
      users: 15,
      features: [
        "Advanced time tracking",
        "Resource planning",
        "Client portal",
        "Expense tracking",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199,
      users: "Unlimited",
      features: [
        "Custom workflows",
        "API access",
        "Dedicated support",
        "Advanced analytics",
        "SSO integration",
      ],
    },
  ];

  // Calculate annual pricing with 10% discount
  const getPrice = (plan) => {
    const basePrice = plan.price;
    return billingCycle === "annual" ? Math.round(basePrice * 0.9) : basePrice;
  };

  // Mock payment methods
  const paymentMethods = [
    { id: "credit_card", last4: "4242", brand: "Visa", expiry: "12/26" },
  ];

  // Mock invoice history
  const invoices = [
    { id: "INV-2025-001", date: "2025-06-01", amount: 99, status: "paid" },
    { id: "INV-2025-002", date: "2025-05-01", amount: 99, status: "paid" },
    { id: "INV-2025-003", date: "2025-04-01", amount: 99, status: "paid" },
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
          if (data.interval) {
            setBillingCycle(data.interval);
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
      await startCheckout(planId, billingCycle);
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
          interval: billingCycle,
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

  const handleCycleChange = async (cycle) => {
    if (cycle === billingCycle) return;

    // If no subscription exists, start checkout
    if (!subscription || subscription.status === "none") {
      await startCheckout(billingPlan, cycle);
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
          plan: billingPlan,
          interval: cycle,
        }),
      });

      if (response.ok) {
        setBillingCycle(cycle);
        toast.success("Billing cycle updated successfully");
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
        toast.error(error.error || "Failed to update billing cycle");
      }
    } catch (error) {
      console.error("Error updating billing cycle:", error);
      toast.error("Failed to update billing cycle");
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
    <div className="billing-settings">
      <div className="billing-header">
        <h1 className="billing-title">Billing & Subscription</h1>
        <div className="current-plan-section">
          <h3 className="current-plan-title">Current Plan</h3>
          {subscription && subscription.status !== "none" && (
            <button
              className="btn btn-outline-primary manage-billing-btn"
              onClick={openPortal}
              disabled={loading}
            >
              <i className="fas fa-cog mr-1"></i>
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="pricing-toggle-container">
        <div className="pricing-toggle">
          <button
            className={`toggle-option ${
              billingCycle === "monthly" ? "active" : ""
            }`}
            onClick={() => handleCycleChange("monthly")}
            disabled={loading}
          >
            Monthly
          </button>
          <button
            className={`toggle-option ${
              billingCycle === "annual" ? "active" : ""
            }`}
            onClick={() => handleCycleChange("annual")}
            disabled={loading}
          >
            Annual (Save 10%)
          </button>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="pricing-plans">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${
              plan.id === billingPlan ? "current-plan" : ""
            } ${loading ? "loading" : ""}`}
            onClick={() => !loading && handlePlanChange(plan.id)}
          >
            {plan.id === billingPlan && (
              <div className="current-plan-badge">Current Plan</div>
            )}
            <div className="plan-header">
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price-amount">${getPrice(plan)}</span>
                <span className="price-period">/ month</span>
              </div>
              <div className="plan-users">Up to {plan.users} users</div>
            </div>
            <div className="plan-features">
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <svg
                      className="check-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
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
