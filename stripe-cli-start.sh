#!/bin/bash

# Stripe CLI Setup and Start Script for TimePulse
# This script helps you set up and run Stripe CLI for local webhook testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Stripe CLI Setup for TimePulse                    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI is not installed${NC}"
    echo ""
    echo -e "${YELLOW}Installing Stripe CLI...${NC}"
    
    # Check OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Installing via Homebrew..."
            brew install stripe/stripe-cli/stripe
        else
            echo -e "${RED}Homebrew not found. Please install Homebrew first:${NC}"
            echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        echo -e "${RED}Please install Stripe CLI manually:${NC}"
        echo "  macOS: brew install stripe/stripe-cli/stripe"
        echo "  Linux: curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg"
        echo "  Windows: scoop install stripe"
        echo ""
        echo "Visit: https://stripe.com/docs/stripe-cli#install"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Stripe CLI is installed${NC}"
stripe --version
echo ""

# Check if logged in
echo -e "${YELLOW}Checking Stripe CLI authentication...${NC}"
if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Stripe${NC}"
    echo ""
    echo "Please log in to Stripe (this will open your browser):"
    stripe login
else
    echo -e "${GREEN}✅ Already authenticated with Stripe${NC}"
fi
echo ""

# Check if server is running
echo -e "${YELLOW}Checking if TimePulse server is running...${NC}"
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running on port 5000${NC}"
else
    echo -e "${RED}⚠️  Server is not running on port 5000${NC}"
    echo ""
    echo -e "${YELLOW}Please start your server in another terminal:${NC}"
    echo "  cd /Users/selva/Projects/TimePulse/server"
    echo "  npm start"
    echo ""
    read -p "Press Enter once the server is running..."
fi
echo ""

# Show webhook endpoint
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎯 Webhook Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Webhook Endpoint:${NC} http://localhost:5000/api/billing/webhook"
echo ""

# Check if .env file exists
ENV_FILE="/Users/selva/Projects/TimePulse/server/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo -e "Creating .env file at: ${ENV_FILE}"
    touch "$ENV_FILE"
fi

echo -e "${YELLOW}📝 Important:${NC}"
echo "1. The Stripe CLI will generate a webhook signing secret"
echo "2. Copy the secret (starts with 'whsec_')"
echo "3. Add it to your .env file as: STRIPE_WEBHOOK_SECRET=whsec_..."
echo "4. Restart your server after updating .env"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

read -p "Press Enter to start Stripe webhook forwarding..."
echo ""

echo -e "${GREEN}🚀 Starting Stripe Webhook Forwarding...${NC}"
echo ""
echo -e "${YELLOW}Keep this terminal open to receive webhooks!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Start listening with detailed output
stripe listen --forward-to http://localhost:5000/api/billing/webhook --print-json

echo ""
echo -e "${YELLOW}Stripe CLI stopped${NC}"


