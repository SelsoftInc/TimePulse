# AWS CLI Deployment Commands for VSCode Terminal

You can run all these commands directly from VSCode's integrated terminal (Terminal → New Terminal).

## Prerequisites

1. **Install AWS CLI** (if not already installed):
```bash
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

2. **Configure AWS CLI:**
```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

3. **Verify AWS CLI:**
```bash
aws sts get-caller-identity
```

## 1. Create RDS PostgreSQL Database

```bash
# Create RDS database instance
aws rds create-db-instance \
  --db-instance-identifier timepulse-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --db-name timepulse_db \
  --publicly-accessible \
  --backup-retention-period 7 \
  --region us-east-1

# Check database status
aws rds describe-db-instances \
  --db-instance-identifier timepulse-db \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' \
  --output table

# Get database endpoint (save this for later)
aws rds describe-db-instances \
  --db-instance-identifier timepulse-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

## 2. Create Secrets in AWS Secrets Manager

```bash
# Create database password secret
aws secretsmanager create-secret \
  --name timepulse/db-password \
  --description "RDS database password for TimePulse" \
  --secret-string "YourSecurePassword123!" \
  --region us-east-1

# Create JWT secret
aws secretsmanager create-secret \
  --name timepulse/jwt-secret \
  --description "JWT secret key for TimePulse" \
  --secret-string "your-super-secret-jwt-key-change-this-in-production" \
  --region us-east-1

# Get secret ARNs (save these for App Runner config)
aws secretsmanager list-secrets \
  --filters Key=name,Values=timepulse \
  --query 'SecretList[*].[Name,ARN]' \
  --output table
```

## 3. Create ECR Repository for Python Engine

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name timepulse-engine \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true

# Get ECR repository URI (save this)
aws ecr describe-repositories \
  --repository-names timepulse-engine \
  --query 'repositories[0].repositoryUri' \
  --output text

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

## 4. Build and Push Python Engine Docker Image

```bash
# Navigate to engine directory
cd engine

# Build Docker image
docker build -t timepulse-engine .

# Get your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# Tag image
docker tag timepulse-engine:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/timepulse-engine:latest

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Push image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/timepulse-engine:latest
```

## 5. Create App Runner Service for Python Engine

```bash
# Create App Runner service configuration file
cat > apprunner-service-config.json <<EOF
{
  "ServiceName": "timepulse-engine",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8000",
        "RuntimeEnvironmentVariables": {
          "DEBUG": "false",
          "HOST": "0.0.0.0",
          "PORT": "8000",
          "CORS_ORIGINS": "https://your-amplify-app.amplifyapp.com,https://your-backend.us-east-1.awsapprunner.com",
          "AWS_REGION": "us-east-1"
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

# Create App Runner service
aws apprunner create-service \
  --cli-input-json file://apprunner-service-config.json \
  --region us-east-1

# Check service status
aws apprunner list-services \
  --query 'ServiceSummaryList[?ServiceName==`timepulse-engine`]' \
  --output table

# Get service URL (save this)
aws apprunner describe-service \
  --service-arn $(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`timepulse-engine`].ServiceArn' --output text) \
  --query 'Service.ServiceUrl' \
  --output text
```

## 6. Update Node.js App Runner Service

```bash
# Get current App Runner service ARN
aws apprunner list-services \
  --query 'ServiceSummaryList[?ServiceName==`timepulse-backend`].ServiceArn' \
  --output text

# Update service (you'll need to create a new revision)
# First, get your current service configuration
aws apprunner describe-service \
  --service-arn YOUR_SERVICE_ARN \
  --query 'Service.SourceConfiguration' \
  --output json > current-config.json

# Update the configuration with new environment variables
# Then update the service
aws apprunner start-deployment \
  --service-arn YOUR_SERVICE_ARN
```

## 7. Create/Update Amplify App Environment Variables

```bash
# List Amplify apps
aws amplify list-apps \
  --query 'apps[*].[name,appId]' \
  --output table

# Get app ID
export AMPLIFY_APP_ID=$(aws amplify list-apps --query 'apps[0].appId' --output text)

# Update environment variables
aws amplify update-app \
  --app-id $AMPLIFY_APP_ID \
  --environment-variables \
    REACT_APP_API_BASE=https://your-backend.us-east-1.awsapprunner.com \
    REACT_APP_ENGINE_API_URL=https://your-backend.us-east-1.awsapprunner.com/api/engine

# Trigger a new build
aws amplify start-job \
  --app-id $AMPLIFY_APP_ID \
  --branch-name main \
  --job-type RELEASE
```

## 8. Useful Monitoring Commands

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier timepulse-db \
  --query 'DBInstances[0].[DBInstanceStatus,DBInstanceClass,Endpoint.Address]' \
  --output table

# Check App Runner services
aws apprunner list-services \
  --query 'ServiceSummaryList[*].[ServiceName,Status,ServiceUrl]' \
  --output table

# View App Runner logs (requires CloudWatch Logs)
aws logs tail /aws/apprunner/timepulse-engine/service --follow

# Check ECR images
aws ecr describe-images \
  --repository-name timepulse-engine \
  --query 'imageDetails[*].[imageTags[0],imagePushedAt]' \
  --output table

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/AppRunner \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=timepulse-engine \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## 9. Database Migration Commands

```bash
# Connect to App Runner instance (if SSH is enabled)
# Or run migrations locally pointing to RDS

# Get RDS endpoint
export DB_HOST=$(aws rds describe-db-instances \
  --db-instance-identifier timepulse-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Set environment variables for local migration
export DB_PORT=5432
export DB_NAME=timepulse_db
export DB_USER=postgres
export DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id timepulse/db-password \
  --query SecretString \
  --output text)

# Run migrations (from server directory)
cd server
npm run setup-db
```

## 10. Quick Status Check Script

Create a script to check all services:

```bash
# Create status check script
cat > check-aws-status.sh <<'EOF'
#!/bin/bash

echo "=== AWS TimePulse Deployment Status ==="
echo ""

echo "📊 RDS Database:"
aws rds describe-db-instances \
  --db-instance-identifier timepulse-db \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' \
  --output table 2>/dev/null || echo "❌ RDS not found"

echo ""
echo "🚀 App Runner Services:"
aws apprunner list-services \
  --query 'ServiceSummaryList[*].[ServiceName,Status,ServiceUrl]' \
  --output table

echo ""
echo "🔐 Secrets:"
aws secretsmanager list-secrets \
  --filters Key=name,Values=timepulse \
  --query 'SecretList[*].[Name,ARN]' \
  --output table

echo ""
echo "🐳 ECR Repository:"
aws ecr describe-repositories \
  --repository-names timepulse-engine \
  --query 'repositories[0].[repositoryUri,imageScanningConfiguration.scanOnPush]' \
  --output table 2>/dev/null || echo "❌ ECR repository not found"
EOF

chmod +x check-aws-status.sh

# Run status check
./check-aws-status.sh
```

## 11. Cleanup Commands (if needed)

```bash
# Delete App Runner service
aws apprunner delete-service \
  --service-arn YOUR_SERVICE_ARN

# Delete RDS instance (careful - this deletes data!)
aws rds delete-db-instance \
  --db-instance-identifier timepulse-db \
  --skip-final-snapshot

# Delete ECR repository
aws ecr delete-repository \
  --repository-name timepulse-engine \
  --force

# Delete secrets
aws secretsmanager delete-secret \
  --secret-id timepulse/db-password \
  --force-delete-without-recovery

aws secretsmanager delete-secret \
  --secret-id timepulse/jwt-secret \
  --force-delete-without-recovery
```

## Tips for Using in VSCode

1. **Use VSCode Terminal:**
   - Press `` Ctrl+` `` (or `Cmd+` on Mac) to open terminal
   - Or: Terminal → New Terminal

2. **Create a Task:**
   - Create `.vscode/tasks.json` to run common commands
   - Press `Cmd+Shift+P` → "Tasks: Run Task"

3. **Use Variables:**
   - Store AWS account ID, region, etc. in environment variables
   - Use `.env` files (but don't commit secrets!)

4. **Multi-terminal:**
   - Split terminal to run multiple commands
   - Right-click terminal tab → "Split Terminal"

5. **AWS CLI Autocomplete:**
   ```bash
   # Enable autocomplete
   complete -C aws_completer aws
   ```

## Example VSCode Task Configuration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Check AWS Status",
      "type": "shell",
      "command": "./check-aws-status.sh",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Build and Push Python Engine",
      "type": "shell",
      "command": "cd engine && docker build -t timepulse-engine . && docker tag timepulse-engine:latest ${input:ecrUri}:latest && docker push ${input:ecrUri}:latest",
      "group": "build"
    }
  ],
  "inputs": [
    {
      "id": "ecrUri",
      "type": "promptString",
      "description": "Enter ECR URI"
    }
  ]
}
```

## Quick Reference

```bash
# Set common variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get service URLs
echo "Backend: $(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`timepulse-backend`].ServiceUrl' --output text)"
echo "Engine: $(aws apprunner list-services --query 'ServiceSummaryList[?ServiceName==`timepulse-engine`].ServiceUrl' --output text)"
echo "RDS: $(aws rds describe-db-instances --db-instance-identifier timepulse-db --query 'DBInstances[0].Endpoint.Address' --output text)"
```

All these commands can be run directly in VSCode's integrated terminal!

