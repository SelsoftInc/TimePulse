# AWS Deployment Checklist for TimePulse

## ✅ Already Created
1. **AWS Amplify** - Frontend (React) deployment
2. **AWS App Runner** - Node.js backend service

## 🔴 Still Need to Create

### 1. Python Engine Service (FastAPI)
**Service:** AWS App Runner or ECS Fargate

**Option A: AWS App Runner (Recommended - Easiest)**
- Go to AWS App Runner Console
- Create new service
- Source: Container registry (ECR) or Source code repository
- Use the `engine/Dockerfile`
- Configure:
  - Port: 8000
  - Health check: `/health`
  - Environment variables (see below)

**Option B: ECS Fargate (More control)**
- Create ECS cluster
- Create task definition using `engine/Dockerfile`
- Create service with Fargate launch type
- Set up Application Load Balancer

**Environment Variables for Python Engine:**
```bash
DEBUG=false
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=https://your-amplify-app.amplifyapp.com,https://your-app-runner-url.us-east-1.awsapprunner.com
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
CLAUDE_MODEL_ID=your_claude_model_id
BEDROCK_IDP_ENDPOINT=your_bedrock_endpoint
```

### 2. RDS PostgreSQL Database
**Service:** AWS RDS

**Steps:**
1. Go to AWS RDS Console
2. Create database → PostgreSQL
3. Configuration:
   - DB instance identifier: `timepulse-db`
   - Master username: `postgres`
   - Master password: (store in AWS Secrets Manager)
   - DB name: `timepulse_db`
   - Instance class: `db.t3.micro` (free tier eligible)
   - Storage: 20 GB (free tier)
   - Public access: Yes (or configure VPC properly)
4. **Important:** Note the endpoint URL
5. Create security group allowing:
   - Port 5432 from App Runner security group
   - Port 5432 from Python Engine security group

### 3. AWS Secrets Manager
**Service:** AWS Secrets Manager

**Create secrets for:**
1. RDS Database Password
2. JWT Secret
3. AWS Credentials (for Python Engine)

**Example:**
```bash
aws secretsmanager create-secret \
  --name timepulse/db-password \
  --secret-string "your-secure-password"

aws secretsmanager create-secret \
  --name timepulse/jwt-secret \
  --secret-string "your-jwt-secret-key"
```

### 4. Environment Variables Configuration

#### For Node.js App Runner Service:
Update `server/apprunner.yaml` or App Runner console with:
```yaml
env:
  - name: NODE_ENV
    value: "production"
  - name: PORT
    value: "8080"
  - name: USE_SQLITE
    value: "false"
  - name: DB_HOST
    value: "your-rds-endpoint.rds.amazonaws.com"
  - name: DB_PORT
    value: "5432"
  - name: DB_NAME
    value: "timepulse_db"
  - name: DB_USER
    value: "postgres"
  - name: PYTHON_ENGINE_URL
    value: "https://your-python-engine-url.us-east-1.awsapprunner.com"
  - name: CORS_ORIGIN
    value: "https://your-amplify-app.amplifyapp.com"
  - name: JWT_SECRET
    value-from: "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timepulse/jwt-secret"
secrets:
  - name: DB_PASSWORD
    value-from: "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timepulse/db-password"
```

#### For Amplify Frontend:
In Amplify Console → App settings → Environment variables:
```bash
REACT_APP_API_BASE=https://your-app-runner-url.us-east-1.awsapprunner.com
REACT_APP_ENGINE_API_URL=https://your-app-runner-url.us-east-1.awsapprunner.com/api/engine
```

### 5. Security Groups Configuration

**RDS Security Group:**
- Inbound rule: PostgreSQL (5432) from App Runner security group
- Inbound rule: PostgreSQL (5432) from Python Engine security group

**App Runner Security Group:**
- Automatically managed, but ensure it can reach RDS

**Python Engine Security Group:**
- Inbound rule: HTTP (80) or HTTPS (443) from App Runner
- Outbound rule: All traffic (for AWS Bedrock/Claude API calls)

### 6. IAM Roles & Permissions

**For App Runner (Node.js):**
- Access to Secrets Manager
- Access to RDS (if using IAM authentication)

**For Python Engine:**
- Access to AWS Bedrock (for Claude API)
- Access to Secrets Manager (if storing credentials there)

**IAM Policy Example for Bedrock:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-v1"
    }
  ]
}
```

### 7. Database Migration
After RDS is created:
1. Connect to App Runner instance (or use local connection)
2. Run database migrations:
```bash
cd server
npm run setup-db
```

Or use AWS Systems Manager Session Manager to connect:
```bash
aws ssm start-session --target <instance-id>
```

### 8. Update Frontend Configuration
Update `frontend/src/services/engineService.js`:
```javascript
const ENGINE_API_BASE_URL = process.env.REACT_APP_ENGINE_API_URL || 
  'https://your-app-runner-url.us-east-1.awsapprunner.com/api/engine';
```

## 📋 Deployment Steps Summary

1. ✅ **Frontend (Amplify)** - Already created
2. ✅ **Backend (App Runner)** - Already created
3. 🔴 **Create RDS PostgreSQL Database**
4. 🔴 **Create Python Engine Service (App Runner or ECS)**
5. 🔴 **Create Secrets in AWS Secrets Manager**
6. 🔴 **Configure Environment Variables** in App Runner and Python Engine
7. 🔴 **Configure Security Groups** for RDS and services
8. 🔴 **Set up IAM Roles** with proper permissions
9. 🔴 **Run Database Migrations**
10. 🔴 **Update Frontend Environment Variables** in Amplify
11. 🔴 **Test End-to-End** - Verify all services communicate

## 🔗 Service URLs Reference

After deployment, you'll have:
- **Frontend:** `https://your-app.amplifyapp.com`
- **Backend API:** `https://your-backend.us-east-1.awsapprunner.com`
- **Python Engine:** `https://your-engine.us-east-1.awsapprunner.com`
- **RDS Endpoint:** `your-db.xxxxx.us-east-1.rds.amazonaws.com:5432`

## 💰 Cost Estimation

- **Amplify:** Free tier (5 GB storage, 15 GB bandwidth/month)
- **App Runner:** ~$0.007 per vCPU-hour, ~$0.0008 per GB-hour
- **RDS (db.t3.micro):** Free tier eligible (750 hours/month)
- **ECS Fargate:** ~$0.04 per vCPU-hour, ~$0.004 per GB-hour
- **Secrets Manager:** $0.40 per secret per month

**Estimated Monthly Cost (with free tier):**
- Small deployment: $10-30/month
- Production: $50-150/month

## 🚨 Important Notes

1. **Database Backups:** Enable automated backups in RDS
2. **SSL/TLS:** Use HTTPS for all services
3. **CORS:** Configure CORS origins properly
4. **Monitoring:** Set up CloudWatch alarms
5. **Logs:** Enable CloudWatch Logs for all services
6. **Health Checks:** Configure health check endpoints
7. **Scaling:** Configure auto-scaling for App Runner services

## 🔍 Verification Checklist

- [ ] Frontend loads at Amplify URL
- [ ] Backend health check: `/health` returns 200
- [ ] Python Engine health check: `/health` returns 200
- [ ] Database connection works from backend
- [ ] Backend can reach Python Engine
- [ ] Frontend can call backend API
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] Secrets are accessible
- [ ] Database migrations completed
- [ ] All services have proper security groups

