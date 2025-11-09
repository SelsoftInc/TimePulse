# AWS Setup Guide for Account 727044518907

## Important: AWS CLI Uses Access Keys, Not Username/Password

AWS CLI requires:
- **AWS Access Key ID** (not username)
- **AWS Secret Access Key** (not password)

## Step 1: Get Your AWS Access Keys

1. **Go to AWS Console:**
   - https://console.aws.amazon.com/
   - Login with: `selvakumar` / `React135#`

2. **Navigate to IAM:**
   - Search for "IAM" in the top search bar
   - Click on "IAM" service

3. **Get Access Keys:**
   - Click on your username: `selvakumar`
   - Go to "Security credentials" tab
   - Scroll down to "Access keys"
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Click "Next" → "Create access key"
   - **IMPORTANT:** Copy both:
     - Access Key ID (starts with `AKIA...`)
     - Secret Access Key (shown only once!)

## Step 2: Configure AWS CLI

Run this command in VSCode terminal:

```bash
aws configure
```

Enter the following when prompted:
1. **AWS Access Key ID:** `AKIA...` (the one you just copied)
2. **AWS Secret Access Key:** `...` (the secret key you copied)
3. **Default region name:** `us-east-1` (or your preferred region)
4. **Default output format:** `json` (just press Enter)

## Step 3: Verify Configuration

```bash
aws sts get-caller-identity
```

You should see:
```json
{
    "UserId": "...",
    "Account": "727044518907",
    "Arn": "arn:aws:iam::727044518907:user/selvakumar"
}
```

## Step 4: Check Your Services

Once configured, check what you have:

```bash
# Check App Runner services
aws apprunner list-services

# Check RDS databases
aws rds describe-db-instances

# Check Amplify apps
aws amplify list-apps

# Check ECR repositories
aws ecr describe-repositories
```

## Alternative: Use Named Profiles

If you want to keep multiple AWS accounts configured:

```bash
# Configure a named profile
aws configure --profile selvakumar

# Use the profile
aws apprunner list-services --profile selvakumar

# Or set as default
export AWS_PROFILE=selvakumar
```

## Security Best Practices

1. **Never commit credentials to Git**
   - Add `.aws/` to `.gitignore`
   - Never share access keys

2. **Use AWS Secrets Manager for passwords**
   - Store database passwords in Secrets Manager
   - Store JWT secrets in Secrets Manager
   - Don't hardcode passwords

3. **Rotate access keys regularly**
   - Create new keys every 90 days
   - Delete old keys after verifying new ones work

4. **Use IAM roles when possible**
   - For EC2, ECS, Lambda: use IAM roles
   - Don't store credentials on instances

## Quick Setup Script

After you get your access keys, you can run:

```bash
# Configure AWS CLI
aws configure

# Verify
aws sts get-caller-identity

# Check services
./scripts/aws-deploy.sh
```

## Need Help?

If you can't find your access keys:
1. Make sure you have IAM permissions to create access keys
2. Contact your AWS administrator if needed
3. Check if you're using the correct AWS account

