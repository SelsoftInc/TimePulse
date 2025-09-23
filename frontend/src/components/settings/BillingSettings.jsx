import React, { useState } from "react";
import "./Settings.css";

const BillingSettings = () => {
  const [billingPlan, setBillingPlan] = useState("professional");
  const [billingCycle, setBillingCycle] = useState("monthly");

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

  const handlePlanChange = (planId) => {
    setBillingPlan(planId);
    // In a real app, this would trigger an API call to update the subscription
  };

  const handleCycleChange = (cycle) => {
    setBillingCycle(cycle);
    // In a real app, this would trigger an API call to update the billing cycle
  };

  return (
    <div className="settings-screen">
      <div className="settings-section">
        <h2 className="settings-title">Billing & Subscription</h2>

        {/* Current Plan */}
        <div className="card">
          <div className="card-inne">
            <div className="current-plan">
              <h5>Current Plan</h5>
              <div className="billing-cycle">
                {/* <h5>Billing Cycle </h5> */}
                <div className="cycle-options">
                  <button
                    className={`btn ${
                      billingCycle === "monthly"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => handleCycleChange("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    className={`btn ${
                      billingCycle === "annual"
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => handleCycleChange("annual")}
                  >
                    Annual (Save 10%)
                  </button>
                </div>
              </div>
            </div>
            <div className="plan-details">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-option ${
                    plan.id === billingPlan ? "active" : ""
                  }`}
                  onClick={() => handlePlanChange(plan.id)}
                >
                  <div className="plan-header">
                    <h5>{plan.name}</h5>
                    <div className="plan-price">
                      <span className="amount">${plan.price}</span>
                      <span className="period"> / month</span>
                    </div>
                  </div>
                  <div className="plan-features">
                    <div className="plan-users">Up to {plan.users} users</div>
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ color: "green" }}
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                            aria-hidden="true"
                          >
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                          <span style={{ color: "grey", marginLeft: "8px" }}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {plan.id === billingPlan && (
                    <div className="plan-current">
                      <span>Current Plan</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card mt-4">
          <div className="card-inne">
            <h5>Payment Methods</h5>
            <div className="payment-methods">
              {paymentMethods.map((method) => (
                <div key={method.id} className="payment-method">
                  <div className="payment-icon">
                    {method.brand === "Visa" && (
                      <i className="fab fa-cc-visa"></i>
                    )}
                    {method.brand === "Mastercard" && (
                      <i className="fab fa-cc-mastercard"></i>
                    )}
                    {method.brand === "Amex" && (
                      <i className="fab fa-cc-amex"></i>
                    )}
                  </div>
                  <div className="payment-details">
                    <div className="payment-name">
                      {method.brand} ending in {method.last4}
                    </div>
                    <div className="payment-expiry">
                      Expires {method.expiry}
                    </div>
                  </div>
                  <div className="payment-actions">
                    <button className="btn btn-sm btn-outline-primary">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-primary mt-3">
                <i className="fas fa-plus mr-1"></i> Add Payment Method
              </button>
            </div>
          </div>
        </div>

        {/* Invoice History */}
        <div className="card mt-4">
          <div className="card-inne">
            <h5>Invoice History</h5>
            <table className="table-payment">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>${invoice.amount.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge badge-${
                          invoice.status === "paid" ? "success" : "warning"
                        }`}
                      >
                        {invoice.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;
