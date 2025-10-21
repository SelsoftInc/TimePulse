# AWS Backend Deployment Guide for TimePulse

## 🚀 **Option 1: AWS Elastic Beanstalk (Recommended)**

### **Step 1: Prepare for Deployment**

1. **Install AWS CLI** (if not already installed):
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

### **Step 2: Use Existing AWS RDS Database**

✅ **You already have an RDS database set up!**

**Your Database Details:**
- **Endpoint**: `timepulse-cluster-instance-1.chb4yd9ykrnf.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Engine**: Aurora PostgreSQL
- **Database Name**: `timepulse_db` (you'll need to create this database)

**Next Steps:**
1. **Connect to your database** and create the `timepulse_db` database
2. **Note your database password** (you'll need it for the deployment)
3. **Update the database configuration** in `server/.ebextensions/database.config` with your actual password

### **Step 3: Deploy Backend to Elastic Beanstalk**

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Initialize Elastic Beanstalk**:
   ```bash
   eb init
   ```
   - Select your region
   - Create new application: `timepulse-backend`
   - Platform: Node.js
   - Version: Node.js 18

3. **Create environment**:
   ```bash
   eb create production
   ```

4. **Set environment variables**:
   ```bash
   eb setenv DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/timepulse_db"
   eb setenv DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/timepulse_db"
   eb setenv NODE_ENV="production"
   eb setenv JWT_SECRET="your-jwt-secret-here"
   ```

5. **Deploy**:
   ```bash
   eb deploy
   ```

6. **Get your backend URL**:
   ```bash
   eb status
   ```

### **Step 4: Update Frontend API URL**

1. **Go to AWS Amplify Console**
2. **App settings** → **Environment variables**
3. **Set**:
   ```
   REACT_APP_API_BASE = https://your-eb-app.region.elasticbeanstalk.com
   ```

---

## 🚀 **Option 2: AWS Lambda + API Gateway (Serverless)**

### **Step 1: Install Serverless Framework**
```bash
npm install -g serverless
npm install serverless-http
```

### **Step 2: Create serverless.yml**
```yaml
service: timepulse-backend

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${env:JWT_SECRET}

functions:
  api:
    handler: serverless.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

### **Step 3: Deploy**
```bash
serverless deploy
```

---

## 🚀 **Option 3: AWS ECS with Fargate (Containerized)**

### **Step 1: Create Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

### **Step 2: Build and Push to ECR**
```bash
aws ecr create-repository --repository-name timepulse-backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker build -t timepulse-backend .
docker tag timepulse-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timepulse-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timepulse-backend:latest
```

---

## 🔧 **Database Migration**

After deploying, run database migrations:

```bash
# Connect to your deployed backend
eb ssh

# Run migrations
npm run migrate:deploy
```

---

## 🌐 **Update Frontend**

Once backend is deployed, update Amplify environment variables:

1. **Amplify Console** → **App settings** → **Environment variables**
2. **Set**:
   ```
   REACT_APP_API_BASE = https://your-backend-url.com
   ```
3. **Redeploy** frontend

---

## 📋 **Quick Start Commands**

```bash
# Option 1: Elastic Beanstalk
cd server
eb init
eb create production
eb setenv DATABASE_URL="your-database-url"
eb deploy

# Option 2: Serverless
cd server
serverless deploy

# Option 3: ECS (after Docker setup)
aws ecs create-service --cluster your-cluster --service-name timepulse-backend --task-definition timepulse-backend
```

---

## 💰 **Cost Estimation**

- **Elastic Beanstalk**: ~$15-30/month (includes RDS)
- **Lambda**: ~$5-10/month (pay per request)
- **ECS Fargate**: ~$20-40/month (always running)

**Recommendation**: Start with Elastic Beanstalk for simplicity!
