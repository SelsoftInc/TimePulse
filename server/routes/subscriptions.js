const express = require("express");
const router = express.Router();
const { models } = require("../models");

// GET /api/subscriptions/plans - Get available subscription plans
router.get("/plans", async (req, res, next) => {
  try {
    const plans = [
      {
        id: "starter",
        name: "Starter",
        price: 49,
        users: 5,
        features: ["Basic time tracking", "Project management", "Invoicing"],
        description: "Perfect for small teams getting started"
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
          "Expense tracking"
        ],
        description: "Ideal for growing businesses"
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
          "SSO integration"
        ],
        description: "For large organizations with complex needs"
      }
    ];

    res.json({ success: true, plans });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/current - Get current subscription for tenant
router.get("/current", async (req, res, next) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // For now, return a mock subscription
    // In a real app, this would query the database for actual subscription data
    const subscription = {
      planId: "professional",
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      price: 99,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/change-plan - Change subscription plan
router.post("/change-plan", async (req, res, next) => {
  try {
    const { tenantId, planId, billingCycle } = req.body;

    if (!tenantId || !planId) {
      return res.status(400).json({ error: "Tenant ID and Plan ID are required" });
    }

    // In a real app, this would:
    // 1. Validate the plan exists
    // 2. Check if the tenant can upgrade/downgrade
    // 3. Update the subscription in the database
    // 4. Handle proration for billing
    // 5. Send confirmation email

    console.log(`Subscription change requested: Tenant ${tenantId}, Plan ${planId}, Cycle ${billingCycle}`);

    res.json({ 
      success: true, 
      message: "Subscription plan change initiated",
      subscription: {
        planId,
        billingCycle,
        status: "pending"
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/payment-methods - Get payment methods for tenant
router.get("/payment-methods", async (req, res, next) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Mock payment methods - in real app, integrate with Stripe/PayPal
    const paymentMethods = [
      {
        id: "pm_1234567890",
        brand: "Visa",
        last4: "4242",
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true
      }
    ];

    res.json({ success: true, paymentMethods });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions/payment-methods - Add new payment method
router.post("/payment-methods", async (req, res, next) => {
  try {
    const { tenantId, paymentMethodId } = req.body;

    if (!tenantId || !paymentMethodId) {
      return res.status(400).json({ error: "Tenant ID and Payment Method ID are required" });
    }

    // In a real app, this would:
    // 1. Validate the payment method with Stripe/PayPal
    // 2. Store it securely
    // 3. Set as default if needed

    console.log(`New payment method added: Tenant ${tenantId}, Method ${paymentMethodId}`);

    res.json({ 
      success: true, 
      message: "Payment method added successfully",
      paymentMethod: {
        id: paymentMethodId,
        brand: "Visa",
        last4: "4242",
        isDefault: false
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/invoices - Get invoice history for tenant
router.get("/invoices", async (req, res, next) => {
  try {
    const { tenantId, limit = 10, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required" });
    }

    // Mock invoice history - in real app, query actual invoices
    const invoices = [
      {
        id: "INV-2025-001",
        number: "INV-2025-001",
        date: "2025-01-01",
        amount: 99,
        status: "paid",
        downloadUrl: "/api/invoices/INV-2025-001/download"
      },
      {
        id: "INV-2024-012", 
        number: "INV-2024-012",
        date: "2024-12-01",
        amount: 99,
        status: "paid",
        downloadUrl: "/api/invoices/INV-2024-012/download"
      },
      {
        id: "INV-2024-011",
        number: "INV-2024-011", 
        date: "2024-11-01",
        amount: 99,
        status: "paid",
        downloadUrl: "/api/invoices/INV-2024-011/download"
      }
    ];

    res.json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
