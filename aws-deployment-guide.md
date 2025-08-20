# AWS Deployment Guide for TimePulse

## Prerequisites
- AWS CLI installed and configured
- EB CLI installed: `pip install awsebcli`
- AWS account with appropriate permissions

## Step 1: Create AWS RDS PostgreSQL Database

### Using AWS Console:
1. Go to AWS RDS Console
2. Click "Create database"
3. Choose PostgreSQL
4. Select "Free tier" or "Production" template
5. Configure:
   - DB instance identifier: `timepulse-db`
   - Master username: `postgres`
   - Master password: (create secure password)
   - DB name: `timepulse_db`
6. Make note of the endpoint URL

### Using AWS CLI:
```bash
aws rds create-db-instance \
    --db-instance-identifier timepulse-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password YOUR_SECURE_PASSWORD \
    --allocated-storage 20 \
    --db-name timepulse_db \
    --vpc-security-group-ids sg-xxxxxxxxx \
    --publicly-accessible
```

## Step 2: Deploy Backend to Elastic Beanstalk

### Initialize EB Application:
```bash
cd /Users/selva/Projects/TimePulse/server
eb init -p node.js timepulse-backend --region us-east-1
```

### Create Environment:
```bash
eb create timepulse-production
```

### Set Environment Variables:
```bash
eb setenv \
  NODE_ENV=production \
  DB_HOST=your-rds-endpoint.amazonaws.com \
  DB_PORT=5432 \
  DB_NAME=timepulse_db \
  DB_USER=postgres \
  DB_PASSWORD=your_secure_password \
  JWT_SECRET=your_jwt_secret_key \
  CORS_ORIGIN=https://your-amplify-app.amplifyapp.com
```

### Deploy:
```bash
eb deploy
```

## Step 3: Database Setup

After deployment, run database migrations:
```bash
eb ssh
cd /var/app/current
npm run setup-db
exit
```

## Step 4: Update Frontend CORS

Update your frontend API base URL to point to your EB environment:
- EB URL format: `http://timepulse-production.us-east-1.elasticbeanstalk.com`

## Step 5: Security Configuration

### RDS Security Group:
- Allow inbound PostgreSQL (port 5432) from EB security group
- Allow inbound from your IP for direct access (optional)

### EB Security Group:
- Allow HTTP (80) and HTTPS (443) from anywhere
- Allow SSH (22) from your IP (optional)

## Monitoring and Logs

### View logs:
```bash
eb logs
```

### Monitor health:
```bash
eb health
```

### Open application:
```bash
eb open
```

## Cost Optimization

### Free Tier Resources:
- RDS: db.t3.micro (750 hours/month)
- EB: t3.micro EC2 instance (750 hours/month)
- Load Balancer: Additional cost (~$18/month)

### To minimize costs:
- Use single instance (no load balancer) for development
- Stop/start instances when not in use
- Monitor usage in AWS Cost Explorer

## Troubleshooting

### Common Issues:
1. **Database connection fails**: Check security groups and RDS endpoint
2. **502 Bad Gateway**: Check application logs with `eb logs`
3. **Environment variables**: Verify with `eb printenv`

### Useful Commands:
```bash
eb status                 # Check environment status
eb config                 # Edit configuration
eb terminate             # Delete environment
eb restore               # Restore terminated environment
```
