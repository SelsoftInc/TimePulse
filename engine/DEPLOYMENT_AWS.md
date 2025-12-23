# Python Engine AWS Deployment Guide

## Quick Deployment Options

### Option 1: AWS App Runner (Recommended - Easiest)

#### Prerequisites:
- Docker image in ECR, OR
- Source code in GitHub/CodeCommit

#### Steps:

**A. Using ECR (Container Registry):**

1. **Build and Push Docker Image to ECR:**
```bash
cd engine

# Create ECR repository
aws ecr create-repository --repository-name timepulse-engine --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t timepulse-engine .

# Tag image
docker tag timepulse-engine:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest
```

2. **Create App Runner Service:**
   - Go to AWS App Runner Console
   - Click "Create service"
   - Choose "Container registry" → "Amazon ECR"
   - Select your ECR repository: `timepulse-engine`
   - Image tag: `latest`
   - Service name: `timepulse-engine`
   - Port: `8000`
   - Health check path: `/health`

3. **Configure Environment Variables:**
   - In App Runner service configuration, add:
   ```
   DEBUG=false
   HOST=0.0.0.0
   PORT=8000
   CORS_ORIGINS=https://your-amplify-app.amplifyapp.com,https://your-backend.us-east-1.awsapprunner.com
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   CLAUDE_MODEL_ID=your_model_id
   BEDROCK_IDP_ENDPOINT=your_endpoint
   ```

**B. Using Source Code Repository:**

1. **Create App Runner Service:**
   - Go to AWS App Runner Console
   - Click "Create service"
   - Choose "Source code repository"
   - Connect to GitHub/CodeCommit
   - Repository: Your TimePulse repository
   - Branch: `main` or `master`
   - Build settings:
     - Build command: `cd engine && pip install -r requirements.txt`
     - Start command: `cd engine && uvicorn main:app --host 0.0.0.0 --port 8000`

2. **Configure Environment Variables** (same as above)

### Option 2: ECS Fargate (More Control)

1. **Create ECR Repository:**
```bash
aws ecr create-repository --repository-name timepulse-engine --region us-east-1
```

2. **Build and Push Image** (same as App Runner Option A)

3. **Create ECS Cluster:**
```bash
aws ecs create-cluster --cluster-name timepulse-engine-cluster --region us-east-1
```

4. **Create Task Definition:**
```json
{
  "family": "timepulse-engine",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "timepulse-engine",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "DEBUG", "value": "false"},
        {"name": "PORT", "value": "8000"},
        {"name": "HOST", "value": "0.0.0.0"}
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://44.222.217.57:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/timepulse-engine",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

5. **Create ECS Service:**
   - Use the task definition
   - Configure load balancer (Application Load Balancer)
   - Set up security groups

### Option 3: EC2 with Docker (Most Control, More Setup)

1. **Launch EC2 Instance:**
   - AMI: Amazon Linux 2
   - Instance type: t3.small or larger
   - Security group: Allow port 8000

2. **Install Docker:**
```bash
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
```

3. **Deploy Container:**
```bash
# Pull image from ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest

# Run container
docker run -d \
  --name timepulse-engine \
  -p 8000:8000 \
  -e DEBUG=false \
  -e PORT=8000 \
  -e HOST=0.0.0.0 \
  -e CORS_ORIGINS=https://your-amplify-app.amplifyapp.com \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timepulse-engine:latest
```

## Environment Variables Reference

Required environment variables for Python Engine:

```bash
# Application
DEBUG=false
HOST=0.0.0.0
PORT=8000

# CORS
CORS_ORIGINS=https://your-amplify-app.amplifyapp.com,https://your-backend.us-east-1.awsapprunner.com

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# AWS Bedrock / Claude
CLAUDE_MODEL_ID=anthropic.claude-v1
BEDROCK_IDP_ENDPOINT=your_bedrock_endpoint_url

# Optional: LLM API (if using direct HTTP API)
API_KEY=your_api_key
LLM_MODEL_ID=your_model_id
LLM_API_URL=your_api_url

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
```

## Update Node.js Backend

After deploying Python Engine, update your Node.js App Runner service:

1. **Add Environment Variable:**
```yaml
env:
  - name: PYTHON_ENGINE_URL
    value: "https://your-python-engine-url.us-east-1.awsapprunner.com"
```

2. **Update `server/routes/engine.js`:**
The `PYTHON_ENGINE_URL` environment variable is already used, so it should automatically pick up the new URL.

## Health Check

Test the deployed Python Engine:
```bash
curl https://your-python-engine-url.us-east-1.awsapprunner.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "app_name": "Timesheet Generator API",
  "version": "1.0.0"
}
```

## Troubleshooting

### Common Issues:

1. **Health check fails:**
   - Verify port 8000 is exposed
   - Check health check path: `/health`
   - Review CloudWatch logs

2. **CORS errors:**
   - Verify `CORS_ORIGINS` includes all frontend/backend URLs
   - Check for trailing slashes

3. **AWS Bedrock access denied:**
   - Verify IAM role has Bedrock permissions
   - Check AWS credentials
   - Verify region is correct

4. **Container fails to start:**
   - Check CloudWatch logs
   - Verify environment variables
   - Check Docker image builds correctly

## Cost Estimation

- **App Runner:** ~$0.007 per vCPU-hour, ~$0.0008 per GB-hour
  - Small instance (0.25 vCPU, 0.5 GB): ~$5-10/month
- **ECS Fargate:** ~$0.04 per vCPU-hour, ~$0.004 per GB-hour
  - Small task (0.25 vCPU, 0.5 GB): ~$15-20/month
- **EC2:** Depends on instance type
  - t3.small: ~$15/month

## Recommended Setup

For production, I recommend:
- **App Runner** for Python Engine (easiest, auto-scaling)
- **App Runner** for Node.js backend (already set up)
- **Amplify** for frontend (already set up)
- **RDS PostgreSQL** for database

This gives you:
- ✅ Auto-scaling
- ✅ Health checks
- ✅ Easy deployment
- ✅ Managed infrastructure
- ✅ Cost-effective

