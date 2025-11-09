# AWS Deployment Status - TimePulse

**Last Updated:** November 9, 2025  
**Account:** 727044518907  
**User:** selvakumar

## ✅ Currently Deployed Services

### 1. Frontend - AWS Amplify (Ohio - us-east-2)
- **App ID:** `dolfu0p2owxyr`
- **App Name:** TimePulse
- **Domain:** `dolfu0p2owxyr.amplifyapp.com`
- **Production URL:** `https://main.dolfu0p2owxyr.amplifyapp.com`
- **Repository:** `https://github.com/SelsoftInc/TimePulse`
- **Branch:** `main` (PRODUCTION)
- **Status:** ✅ Running
- **Environment Variables:**
  - `NODE_ENV`: `production`
  - `REACT_APP_API_BASE`: `https://zewunzistm.us-east-1.awsapprunner.com`
  - `REACT_APP_ENGINE_API_URL`: `https://zewunzistm.us-east-1.awsapprunner.com/api/engine`

### 2. Backend - AWS App Runner (Virginia - us-east-1)
- **Service Name:** `timepulse-backend`
- **Service ARN:** `arn:aws:apprunner:us-east-1:727044518907:service/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148`
- **Service ID:** `4ba25417620d44fe9a8bb2a34abae148`
- **URL:** `https://zewunzistm.us-east-1.awsapprunner.com`
- **Status:** ✅ RUNNING
- **Database:** Connected to `timepulse-cluster-instance-1`
- **Configuration:** `server/apprunner.yaml`

### 3. Database - AWS RDS PostgreSQL (Virginia - us-east-1)
- **Instance 1:** `timepulse-cluster-instance-1`
  - **Status:** ✅ available
  - **Endpoint:** `timepulse-cluster-instance-1.chb4yd9ykrnf.us-east-1.rds.amazonaws.com`
  - **Port:** `5432`
  - **Database:** `timepulse_db`
  - **User:** `postgres`
  - **Password:** Stored in AWS Secrets Manager
- **Instance 2:** `rts-instance-1`
  - **Status:** ✅ available
  - **Endpoint:** `rts-instance-1.chb4yd9ykrnf.us-east-1.rds.amazonaws.com`
  - **Database:** `rts`

### 4. Container Registry - AWS ECR (Virginia - us-east-1)
- **Repository Name:** `timepulse-engine`
- **Repository URI:** `727044518907.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine`
- **Status:** ✅ Created
- **Image Scanning:** Enabled

## ❌ Still Need to Create

### 1. Python Engine - AWS App Runner (Virginia - us-east-1)
- **Status:** ❌ Not created
- **Purpose:** FastAPI service for timesheet extraction
- **Docker Image:** Needs to be built and pushed to ECR
- **Location:** `engine/Dockerfile`
- **Port:** `8000`
- **Health Check:** `/health`

**Steps to Create:**
1. Start Docker Desktop
2. Build Docker image: `cd engine && docker build -t timepulse-engine .`
3. Login to ECR: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 727044518907.dkr.ecr.us-east-1.amazonaws.com`
4. Tag image: `docker tag timepulse-engine:latest 727044518907.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest`
5. Push image: `docker push 727044518907.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest`
6. Create App Runner service (use `./scripts/aws-deploy.sh` option 6)

## 🔗 Service URLs

- **Frontend:** https://main.dolfu0p2owxyr.amplifyapp.com
- **Backend API:** https://zewunzistm.us-east-1.awsapprunner.com
- **Backend Health:** https://zewunzistm.us-east-1.awsapprunner.com/health
- **Engine API:** https://zewunzistm.us-east-1.awsapprunner.com/api/engine
- **Engine Health:** https://zewunzistm.us-east-1.awsapprunner.com/api/engine/health
- **Python Engine:** (Not created yet)

## 🔐 Secrets Manager

- **Database Password:** `arn:aws:secretsmanager:us-east-1:727044518907:secret:rdscluster-9f97854d-552e-4d54-81bb-9916133d0d28-JoNKzn`

## 📋 Next Steps

1. **Create Python Engine App Runner Service:**
   - Build and push Docker image to ECR
   - Create App Runner service pointing to ECR image
   - Configure environment variables (CORS, AWS credentials, etc.)
   - Update backend `PYTHON_ENGINE_URL` environment variable

2. **Update Backend Environment Variables:**
   - Add `PYTHON_ENGINE_URL` pointing to new Python Engine service
   - Verify CORS settings

3. **Test End-to-End:**
   - Test frontend → backend communication
   - Test backend → Python Engine communication
   - Test timesheet extraction functionality

## 🛠️ Useful Commands

### Check Services
```bash
# App Runner services
aws apprunner list-services --region us-east-1

# RDS databases
aws rds describe-db-instances --region us-east-1

# Amplify apps
aws amplify list-apps --region us-east-2

# ECR repositories
aws ecr describe-repositories --region us-east-1
```

### Get Service URLs
```bash
# Backend URL
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:727044518907:service/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148 \
  --query 'Service.ServiceUrl' \
  --output text

# Frontend URL
echo "https://main.dolfu0p2owxyr.amplifyapp.com"
```

### Update Amplify Environment Variables
```bash
aws amplify update-app \
  --app-id dolfu0p2owxyr \
  --region us-east-2 \
  --environment-variables \
    NODE_ENV=production,\
    REACT_APP_API_BASE=https://zewunzistm.us-east-1.awsapprunner.com,\
    REACT_APP_ENGINE_API_URL=https://zewunzistm.us-east-1.awsapprunner.com/api/engine
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Users                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend (Amplify) - Ohio (us-east-2)                 │
│  https://main.dolfu0p2owxyr.amplifyapp.com             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (App Runner) - Virginia (us-east-1)           │
│  https://zewunzistm.us-east-1.awsapprunner.com         │
│  - Node.js/Express                                      │
│  - API Routes                                           │
│  - /api/engine (proxies to Python Engine)              │
└────┬──────────────────────────────┬─────────────────────┘
     │                              │
     │                              │
     ▼                              ▼
┌──────────────────┐    ┌──────────────────────────────┐
│  Python Engine   │    │  RDS PostgreSQL             │
│  (App Runner)    │    │  timepulse-cluster-instance-1│
│  [NOT CREATED]   │    │  Virginia (us-east-1)       │
│  Port: 8000      │    │  Port: 5432                 │
└──────────────────┘    └──────────────────────────────┘
```

## 🔄 Deployment Workflow

1. **Frontend (Amplify):**
   - Push to GitHub: `https://github.com/SelsoftInc/TimePulse`
   - Branch: `main`
   - Auto-deploys on push

2. **Backend (App Runner):**
   - Update code in `server/` directory
   - Push to GitHub
   - App Runner auto-deploys (if configured) or manual deploy

3. **Python Engine (App Runner):**
   - Build Docker image
   - Push to ECR
   - App Runner auto-deploys from ECR

## 💰 Cost Estimation

- **Amplify:** Free tier (5 GB storage, 15 GB bandwidth/month)
- **App Runner:** ~$0.007 per vCPU-hour, ~$0.0008 per GB-hour
  - Backend: ~$5-10/month
  - Python Engine: ~$5-10/month (when created)
- **RDS:** Free tier eligible (db.t3.micro, 750 hours/month)
- **ECR:** $0.10 per GB/month for storage
- **Total Estimated:** ~$10-30/month (with free tier)

## ✅ Deployment Checklist

- [x] Frontend deployed to Amplify (Ohio)
- [x] Backend deployed to App Runner (Virginia)
- [x] RDS database created (Virginia)
- [x] ECR repository created (Virginia)
- [x] Secrets Manager configured
- [x] Environment variables configured
- [ ] Python Engine Docker image built
- [ ] Python Engine Docker image pushed to ECR
- [ ] Python Engine App Runner service created
- [ ] End-to-end testing completed

