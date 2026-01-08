#!/bin/bash

# TimePulse Backend Deployment Script
# This script helps deploy the backend to AWS Elastic Beanstalk

echo "🚀 TimePulse Backend Deployment Script"
echo "======================================"

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

# Navigate to server directory
cd server

echo "📁 Current directory: $(pwd)"

# Check if .elasticbeanstalk directory exists
if [ ! -d ".elasticbeanstalk" ]; then
    echo "🔧 Initializing Elastic Beanstalk..."
    eb init
else
    echo "✅ Elastic Beanstalk already initialized"
fi

# Check if environment exists
echo "🔍 Checking for existing environments..."
eb list

echo ""
echo "📋 Next steps:"
echo "1. Create RDS PostgreSQL database in AWS Console"
echo "2. Note the database endpoint and credentials"
echo "3. Run: eb create production"
echo "4. Set environment variables:"
echo "   eb setenv DATABASE_URL='postgresql://user:pass@endpoint:5432/timepulse_db'"
echo "   eb setenv JWT_SECRET='your-jwt-secret'"
echo "   eb setenv NODE_ENV='production'"
echo "5. Deploy: eb deploy"
echo ""
echo "🌐 After deployment, update your Amplify environment variables:"
echo "   REACT_APP_API_BASE = https://your-eb-app.region.elasticbeanstalk.com"
echo ""
echo "📖 For detailed instructions, see: AWS_BACKEND_DEPLOYMENT_GUIDE.md"


