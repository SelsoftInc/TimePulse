#!/bin/bash

# Script to test Stripe webhook events locally
# Make sure Stripe CLI is running with webhook forwarding before using this script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Stripe Webhook Testing Tool                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI is not installed${NC}"
    echo "Please install it first: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo -e "${GREEN}Select a test event to trigger:${NC}"
echo ""
echo "  1) Checkout Session Completed (new subscription)"
echo "  2) Subscription Created"
echo "  3) Subscription Updated"
echo "  4) Payment Succeeded"
echo "  5) Payment Failed"
echo "  6) Customer Created"
echo "  7) Trigger all subscription events"
echo "  8) View recent events"
echo "  9) Exit"
echo ""
read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        echo -e "${YELLOW}Triggering: checkout.session.completed${NC}"
        stripe trigger checkout.session.completed
        ;;
    2)
        echo -e "${YELLOW}Triggering: customer.subscription.created${NC}"
        stripe trigger customer.subscription.created
        ;;
    3)
        echo -e "${YELLOW}Triggering: customer.subscription.updated${NC}"
        stripe trigger customer.subscription.updated
        ;;
    4)
        echo -e "${YELLOW}Triggering: invoice.payment_succeeded${NC}"
        stripe trigger invoice.payment_succeeded
        ;;
    5)
        echo -e "${YELLOW}Triggering: invoice.payment_failed${NC}"
        stripe trigger invoice.payment_failed
        ;;
    6)
        echo -e "${YELLOW}Triggering: customer.created${NC}"
        stripe trigger customer.created
        ;;
    7)
        echo -e "${YELLOW}Triggering all subscription events...${NC}"
        echo ""
        echo "1. Customer Created"
        stripe trigger customer.created
        sleep 2
        echo ""
        echo "2. Checkout Session Completed"
        stripe trigger checkout.session.completed
        sleep 2
        echo ""
        echo "3. Subscription Created"
        stripe trigger customer.subscription.created
        sleep 2
        echo ""
        echo "4. Payment Succeeded"
        stripe trigger invoice.payment_succeeded
        sleep 2
        echo ""
        echo "5. Subscription Updated"
        stripe trigger customer.subscription.updated
        echo ""
        echo -e "${GREEN}✅ All events triggered!${NC}"
        ;;
    8)
        echo -e "${YELLOW}Recent Events:${NC}"
        stripe events list --limit 10
        ;;
    9)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Event triggered successfully!${NC}"
echo ""
echo -e "${YELLOW}Check:${NC}"
echo "  - Your Stripe CLI terminal for webhook delivery"
echo "  - Your server logs for processing"
echo "  - Database for updated records"
echo ""


