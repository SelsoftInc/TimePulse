#!/bin/bash

# TimePulse AWS Backend Setup Script
# This script helps set up the backend using your existing RDS database

echo "🚀 TimePulse AWS Backend Setup"
echo "=============================="

# Your existing RDS details
RDS_ENDPOINT="timepulse-cluster-instance-1.chb4yd9ykrnf.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
DB_NAME="timepulse_db"

echo "📊 Using existing RDS database:"
echo "   Endpoint: $RDS_ENDPOINT"
echo "   Port: $RDS_PORT"
echo "   Database: $DB_NAME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ EB CLI is not installed. Installing..."
    pip install awsebcli
fi

echo "🔧 Step 1: Create database (if not exists)"
echo "   Connect to your RDS instance and run:"
echo "   CREATE DATABASE timepulse_db;"
echo ""

echo "🔧 Step 2: Update database configuration"
echo "   Edit server/.ebextensions/database.config"
echo "   Replace 'YOUR_PASSWORD' with your actual RDS password"
echo ""

echo "🔧 Step 3: Deploy to Elastic Beanstalk"
echo "   cd server"
echo "   eb init"
echo "   eb create production"
echo "   eb setenv JWT_SECRET='your-jwt-secret-here'"
echo "   eb setenv NODE_ENV='production'"
echo "   eb deploy"
echo ""

echo "🌐 Step 4: Update frontend API URL"
echo "   Go to AWS Amplify Console"
echo "   Set REACT_APP_API_BASE to your Elastic Beanstalk URL"
echo ""

echo "📋 Quick commands:"
echo "   # Connect to RDS (replace with your password):"
echo "   psql -h $RDS_ENDPOINT -p $RDS_PORT -U postgres -d postgres"
echo "   CREATE DATABASE timepulse_db;"
echo ""
echo "   # Deploy backend:"
echo "   cd server && eb init && eb create production && eb deploy"
echo ""

echo "📖 For detailed instructions, see: AWS_BACKEND_DEPLOYMENT_GUIDE.md"


