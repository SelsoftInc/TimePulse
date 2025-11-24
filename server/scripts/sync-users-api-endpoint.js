/**
 * API endpoint to sync users with Stripe subscription
 * POST /api/billing/sync-users
 */

// Add this to your billing.js routes file

/* ------------------------- Sync Users with Stripe ------------------------- */
// POST /api/billing/sync-users
// body: { tenantId }
router.post("/sync-users", async (req, res, next) => {
  try {
    if (!isStripeConfigured) {
      return res.status(503).json({
        error: "Stripe is not configured.",
      });
    }

    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: "tenantId is required" });
    }

    // Get tenant
    const tenant = await models.Tenant.findByPk(tenantId);
    if (!tenant || !tenant.stripeSubscriptionId) {
      return res.status(400).json({ 
        error: "No active subscription found for this tenant" 
      });
    }

    // Count actual users
    const userCount = await models.User.count({
      where: { tenantId }
    });

    // Get current Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId
    );

    const currentQuantity = subscription.items.data[0].quantity;

    // If already in sync, return
    if (userCount === currentQuantity) {
      return res.json({
        success: true,
        message: "Already in sync",
        users: userCount,
        seats: currentQuantity
      });
    }

    // Update Stripe subscription quantity
    const updated = await stripe.subscriptions.update(
      tenant.stripeSubscriptionId,
      {
        items: [{
          id: subscription.items.data[0].id,
          quantity: userCount
        }],
        proration_behavior: 'create_prorations'
      }
    );

    // Update tenant record
    await tenant.update({
      seatLimit: userCount
    });

    const newAmount = (updated.items.data[0].price.unit_amount * userCount / 100).toFixed(2);

    res.json({
      success: true,
      message: "Synced successfully",
      previousSeats: currentQuantity,
      currentSeats: userCount,
      newAmount: `$${newAmount}/month`
    });

  } catch (error) {
    console.error("Sync error:", error);
    next(error);
  }
});

