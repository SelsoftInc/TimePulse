#!/bin/bash

# AWS Deployment Helper Script
# Run this from VSCode terminal: ./scripts/aws-deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
DB_INSTANCE_ID="timepulse-db"
ECR_REPO="timepulse-engine"
APP_RUNNER_SERVICE="timepulse-engine"

echo -e "${GREEN}=== AWS TimePulse Deployment Helper ===${NC}\n"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure'${NC}"
    exit 1
fi

export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ Region: ${AWS_REGION}${NC}\n"

# Function to check if resource exists
check_resource() {
    local resource_type=$1
    local resource_name=$2
    
    case $resource_type in
        rds)
            aws rds describe-db-instances --db-instance-identifier $resource_name &> /dev/null
            ;;
        ecr)
            aws ecr describe-repositories --repository-names $resource_name &> /dev/null
            ;;
        apprunner)
            aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$resource_name']" --output text | grep -q $resource_name
            ;;
        secret)
            aws secretsmanager describe-secret --secret-id $resource_name &> /dev/null
            ;;
    esac
}

# Menu
echo "What would you like to do?"
echo "1) Check deployment status"
echo "2) Create RDS database"
echo "3) Create secrets"
echo "4) Create ECR repository"
echo "5) Build and push Python Engine Docker image"
echo "6) Create App Runner service for Python Engine"
echo "7) Get service URLs"
echo "8) Run database migrations"
echo "9) Full deployment (all steps)"
echo ""
read -p "Enter choice [1-9]: " choice

case $choice in
    1)
        echo -e "\n${YELLOW}=== Deployment Status ===${NC}\n"
        
        echo "📊 RDS Database:"
        if check_resource rds $DB_INSTANCE_ID; then
            aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID \
                --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' \
                --output table
        else
            echo -e "${RED}❌ Not created${NC}"
        fi
        
        echo -e "\n🚀 App Runner Services:"
        aws apprunner list-services --query 'ServiceSummaryList[*].[ServiceName,Status,ServiceUrl]' --output table
        
        echo -e "\n🔐 Secrets:"
        aws secretsmanager list-secrets --filters Key=name,Values=timepulse \
            --query 'SecretList[*].[Name]' --output table 2>/dev/null || echo "None"
        
        echo -e "\n🐳 ECR Repository:"
        if check_resource ecr $ECR_REPO; then
            aws ecr describe-repositories --repository-names $ECR_REPO \
                --query 'repositories[0].repositoryUri' --output text
        else
            echo -e "${RED}❌ Not created${NC}"
        fi
        ;;
        
    2)
        echo -e "\n${YELLOW}Creating RDS database...${NC}"
        read -p "Enter database password: " db_password
        
        aws rds create-db-instance \
            --db-instance-identifier $DB_INSTANCE_ID \
            --db-instance-class db.t3.micro \
            --engine postgres \
            --master-username postgres \
            --master-user-password "$db_password" \
            --allocated-storage 20 \
            --db-name timepulse_db \
            --publicly-accessible \
            --backup-retention-period 7 \
            --region $AWS_REGION
        
        echo -e "${GREEN}✓ RDS database creation started${NC}"
        echo "Check status with: aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_ID"
        ;;
        
    3)
        echo -e "\n${YELLOW}Creating secrets...${NC}"
        
        read -p "Enter database password: " db_password
        read -p "Enter JWT secret: " jwt_secret
        
        # Create DB password secret
        if check_resource secret timepulse/db-password; then
            echo "Secret timepulse/db-password already exists. Updating..."
            aws secretsmanager update-secret \
                --secret-id timepulse/db-password \
                --secret-string "$db_password"
        else
            aws secretsmanager create-secret \
                --name timepulse/db-password \
                --description "RDS database password" \
                --secret-string "$db_password"
        fi
        
        # Create JWT secret
        if check_resource secret timepulse/jwt-secret; then
            echo "Secret timepulse/jwt-secret already exists. Updating..."
            aws secretsmanager update-secret \
                --secret-id timepulse/jwt-secret \
                --secret-string "$jwt_secret"
        else
            aws secretsmanager create-secret \
                --name timepulse/jwt-secret \
                --description "JWT secret key" \
                --secret-string "$jwt_secret"
        fi
        
        echo -e "${GREEN}✓ Secrets created${NC}"
        ;;
        
    4)
        echo -e "\n${YELLOW}Creating ECR repository...${NC}"
        
        if check_resource ecr $ECR_REPO; then
            echo "ECR repository already exists"
        else
            aws ecr create-repository \
                --repository-name $ECR_REPO \
                --region $AWS_REGION \
                --image-scanning-configuration scanOnPush=true
            
            echo -e "${GREEN}✓ ECR repository created${NC}"
        fi
        
        ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"
        echo "Repository URI: $ECR_URI"
        ;;
        
    5)
        echo -e "\n${YELLOW}Building and pushing Docker image...${NC}"
        
        if [ ! -f "engine/Dockerfile" ]; then
            echo -e "${RED}❌ engine/Dockerfile not found${NC}"
            exit 1
        fi
        
        ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"
        
        # Login to ECR
        echo "Logging in to ECR..."
        aws ecr get-login-password --region $AWS_REGION | \
            docker login --username AWS --password-stdin $ECR_URI
        
        # Build image
        echo "Building Docker image..."
        cd engine
        docker build -t $ECR_REPO:latest .
        
        # Tag image
        docker tag $ECR_REPO:latest $ECR_URI:latest
        
        # Push image
        echo "Pushing image to ECR..."
        docker push $ECR_URI:latest
        
        cd ..
        echo -e "${GREEN}✓ Image pushed to ECR${NC}"
        ;;
        
    6)
        echo -e "\n${YELLOW}Creating App Runner service...${NC}"
        
        read -p "Enter Amplify app URL: " amplify_url
        read -p "Enter backend App Runner URL: " backend_url
        
        ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"
        
        cat > /tmp/apprunner-config.json <<EOF
{
  "ServiceName": "$APP_RUNNER_SERVICE",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR_URI:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8000",
        "RuntimeEnvironmentVariables": {
          "DEBUG": "false",
          "HOST": "0.0.0.0",
          "PORT": "8000",
          "CORS_ORIGINS": "$amplify_url,$backend_url",
          "AWS_REGION": "$AWS_REGION"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF
        
        aws apprunner create-service \
            --cli-input-json file:///tmp/apprunner-config.json \
            --region $AWS_REGION
        
        echo -e "${GREEN}✓ App Runner service created${NC}"
        ;;
        
    7)
        echo -e "\n${YELLOW}=== Service URLs ===${NC}\n"
        
        echo "Backend (App Runner):"
        aws apprunner list-services \
            --query 'ServiceSummaryList[?ServiceName==`timepulse-backend`].ServiceUrl' \
            --output text || echo "Not found"
        
        echo -e "\nPython Engine (App Runner):"
        aws apprunner list-services \
            --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceUrl" \
            --output text || echo "Not found"
        
        echo -e "\nRDS Endpoint:"
        aws rds describe-db-instances \
            --db-instance-identifier $DB_INSTANCE_ID \
            --query 'DBInstances[0].Endpoint.Address' \
            --output text 2>/dev/null || echo "Not found"
        ;;
        
    8)
        echo -e "\n${YELLOW}Running database migrations...${NC}"
        
        DB_HOST=$(aws rds describe-db-instances \
            --db-instance-identifier $DB_INSTANCE_ID \
            --query 'DBInstances[0].Endpoint.Address' \
            --output text 2>/dev/null)
        
        if [ -z "$DB_HOST" ]; then
            echo -e "${RED}❌ RDS database not found${NC}"
            exit 1
        fi
        
        DB_PASSWORD=$(aws secretsmanager get-secret-value \
            --secret-id timepulse/db-password \
            --query SecretString \
            --output text 2>/dev/null)
        
        if [ -z "$DB_PASSWORD" ]; then
            echo -e "${RED}❌ Database password secret not found${NC}"
            exit 1
        fi
        
        export DB_HOST
        export DB_PORT=5432
        export DB_NAME=timepulse_db
        export DB_USER=postgres
        export DB_PASSWORD
        export USE_SQLITE=false
        
        cd server
        npm run setup-db
        cd ..
        
        echo -e "${GREEN}✓ Migrations completed${NC}"
        ;;
        
    9)
        echo -e "\n${YELLOW}=== Full Deployment ===${NC}\n"
        echo "This will create all resources. Make sure you have:"
        echo "- Database password"
        echo "- JWT secret"
        echo "- Amplify app URL"
        echo "- Backend App Runner URL"
        echo ""
        read -p "Continue? (y/n): " confirm
        
        if [ "$confirm" != "y" ]; then
            exit 0
        fi
        
        # Run steps 2-8
        $0 2  # Create RDS
        $0 3  # Create secrets
        $0 4  # Create ECR
        $0 5  # Build and push image
        $0 6  # Create App Runner
        $0 8  # Run migrations
        
        echo -e "\n${GREEN}=== Deployment Complete! ===${NC}"
        $0 7  # Show URLs
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

