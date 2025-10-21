const express = require("express");
const Stripe = require("stripe");
const { models } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Initialize Stripe with secret key
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2024-06-20",
  }
);

// Check if Stripe is properly configured
const isStripeConfigured =
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder";

/* ------------------------- PRICE MAP (configure these in your Stripe dashboard) ------------------------- */
const PRICE = {
  starter_monthly: "price_starter_monthly",
  starter_annual: "price_starter_annual",
  pro_monthly: "price_pro_monthly",
  pro_annual: "price_pro_annual",
  enterprise_monthly: "price_enterprise_monthly",
  enterprise_annual: "price_enterprise_annual",
};

/* ------------------------- Helpers --------------------------------------- */
async function getOrCreateCustomer(tenantId, email) {
  try {
    // First, try to get existing tenant with Stripe customer ID
    const tenant = await models.Tenant.findByPk(tenantId);

    if (tenant && tenant.stripeCustomerId) {
      return tenant.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { tenant_id: tenantId },
    });

    // Update tenant with Stripe customer ID
    if (tenant) {
      await tenant.update({ stripeCustomerId: customer.id });
    }

    return customer.id;
  } catch (error) {
    console.error("Error creating/getting Stripe customer:", error);
    throw error;
  }
}

function resolvePrice(plan, interval) {
  return PRICE[`${plan}_${interval}`.toLowerCase()];
}

async function findTenantIdByCustomer(customerId) {
  try {
    const tenant = await models.Tenant.findOne({
      where: { stripeCustomerId: customerId },
    });
    return tenant ? tenant.id : null;
  } catch (error) {
    console.error("Error finding tenant by customer ID:", error);
    return null;
  }
}

/* ------------------------- Create Checkout Session ------------------------ */
// POST /api/billing/checkout
// body: { tenantId, email, plan, interval, seats }
router.post("/checkout", async (req, res, next) => {
  try {
    if (!isStripeConfigured) {
      return res.status(503).json({
        error:
          "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.",
      });
    }

    const { tenantId, email, plan, interval, seats = 1 } = req.body;

    if (!tenantId || !email || !plan || !interval) {
      return res.status(400).json({
        error: "Missing required fields: tenantId, email, plan, interval",
      });
    }

    const price = resolvePrice(plan, interval);
    if (!price) {
      return res
        .status(400)
        .json({ error: "Invalid plan or interval combination" });
    }

    const customerId = await getOrCreateCustomer(tenantId, email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      success_url: `${
        process.env.APP_BASE_URL || "http://localhost:3000"
      }/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.APP_BASE_URL || "http://localhost:3000"
      }/billing/cancelled`,
      allow_promotion_codes: true,
      line_items: [
        {
          price,
          quantity: seats > 0 ? seats : 1,
        },
      ],
      metadata: {
        tenant_id: tenantId,
        plan,
        interval,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    next(error);
  }
});

/* ------------------------- Customer Portal -------------------------------- */
// POST /api/billing/portal
// body: { tenantId }
router.post("/portal", async (req, res, next) => {
  try {
    if (!isStripeConfigured) {
      return res.status(503).json({
        error:
          "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.",
      });
    }

    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: "tenantId is required" });
    }

    const tenant = await models.Tenant.findByPk(tenantId);
    if (!tenant || !tenant.stripeCustomerId) {
      return res
        .status(400)
        .json({ error: "No Stripe customer found for this tenant" });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${
        process.env.APP_BASE_URL || "http://localhost:3000"
      }/settings/billing`,
    });

    res.json({ url: portal.url });
  } catch (error) {
    console.error("Portal error:", error);
    next(error);
  }
});

/* ------------------------- Change Plan (upgrade/downgrade) ---------------- */
// POST /api/billing/change-plan
// body: { tenantId, plan, interval }
router.post("/change-plan", async (req, res, next) => {
  try {
    const { tenantId, plan, interval } = req.body;

    if (!tenantId || !plan || !interval) {
      return res
        .status(400)
        .json({ error: "Missing required fields: tenantId, plan, interval" });
    }

    const tenant = await models.Tenant.findByPk(tenantId);
    if (!tenant || !tenant.stripeSubscriptionId) {
      return res
        .status(400)
        .json({ error: "No active subscription found for this tenant" });
    }

    const price = resolvePrice(plan, interval);
    if (!price) {
      return res
        .status(400)
        .json({ error: "Invalid plan or interval combination" });
    }

    // Get subscription & first item
    const sub = await stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId
    );
    const itemId = sub.items.data[0].id;

    const updated = await stripe.subscriptions.update(sub.id, {
      items: [{ id: itemId, price }],
      proration_behavior: "create_prorations",
    });

    // Update tenant with new plan details
    await tenant.update({
      plan,
      billingInterval: interval,
      status: updated.status,
      currentPeriodEnd: new Date(updated.current_period_end * 1000),
    });

    res.json({
      success: true,
      status: updated.status,
      plan,
      interval,
    });
  } catch (error) {
    console.error("Change plan error:", error);
    next(error);
  }
});

/* ------------------------- Update Seats (quantity) ------------------------ */
// POST /api/billing/update-seats
// body: { tenantId, seats }
router.post("/update-seats", async (req, res, next) => {
  try {
    const { tenantId, seats } = req.body;
    const qty = Number(seats || 1);

    if (!tenantId || qty < 1) {
      return res
        .status(400)
        .json({ error: "tenantId and valid seats count required" });
    }

    const tenant = await models.Tenant.findByPk(tenantId);
    if (!tenant || !tenant.stripeSubscriptionId) {
      return res
        .status(400)
        .json({ error: "No active subscription found for this tenant" });
    }

    const sub = await stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId
    );
    const itemId = sub.items.data[0].id;

    const updated = await stripe.subscriptions.update(sub.id, {
      items: [{ id: itemId, quantity: qty }],
      proration_behavior: "create_prorations",
    });

    // Update tenant with new seat count
    await tenant.update({
      seatLimit: qty,
      currentPeriodEnd: new Date(updated.current_period_end * 1000),
    });

    res.json({
      success: true,
      quantity: updated.items.data[0].quantity,
    });
  } catch (error) {
    console.error("Update seats error:", error);
    next(error);
  }
});

/* ------------------------- Status ---------------------------------------- */
// GET /api/billing/status?tenantId=xxx
router.get("/status", async (req, res, next) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res
        .status(400)
        .json({ error: "tenantId query parameter is required" });
    }

    const tenant = await models.Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.json({ status: "none" });
    }

    res.json({
      plan: tenant.plan || "none",
      interval: tenant.billingInterval || "monthly",
      status: tenant.status || "inactive",
      seats: tenant.seatLimit || 1,
      currentPeriodEnd: tenant.currentPeriodEnd,
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
    });
  } catch (error) {
    console.error("Status error:", error);
    next(error);
  }
});

/* ------------------------- Webhook (raw body!) ---------------------------- */
// POST /api/billing/webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.sendStatus(400);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const tenantId = session.metadata?.tenant_id;

          if (tenantId) {
            const tenant = await models.Tenant.findByPk(tenantId);
            if (tenant) {
              await tenant.update({
                stripeSubscriptionId: sub.id,
                status: sub.status,
                plan: session.metadata?.plan,
                billingInterval: session.metadata?.interval,
                seatLimit: sub.items.data[0]?.quantity || 1,
                currentPeriodEnd: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000)
                  : null,
              });
            }
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object;
          let tenantId = sub.metadata?.tenant_id;

          if (!tenantId) {
            tenantId = await findTenantIdByCustomer(sub.customer);
          }

          if (tenantId) {
            const tenant = await models.Tenant.findByPk(tenantId);
            if (tenant) {
              await tenant.update({
                stripeSubscriptionId: sub.id,
                status: sub.status,
                seatLimit: sub.items.data[0]?.quantity || 1,
                currentPeriodEnd: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000)
                  : null,
              });
            }
          }
          break;
        }

        case "invoice.payment_failed": {
          const inv = event.data.object;
          const tenantId = await findTenantIdByCustomer(inv.customer);

          if (tenantId) {
            const tenant = await models.Tenant.findByPk(tenantId);
            if (tenant) {
              await tenant.update({ status: "past_due" });
            }
          }
          break;
        }

        case "invoice.payment_succeeded": {
          const inv = event.data.object;
          const tenantId = await findTenantIdByCustomer(inv.customer);

          if (tenantId) {
            const tenant = await models.Tenant.findByPk(tenantId);
            if (tenant) {
              await tenant.update({ status: "active" });
            }
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      res.sendStatus(500);
    }
  }
);

module.exports = router;
