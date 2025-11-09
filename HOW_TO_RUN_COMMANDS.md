# How to Run AWS Commands in VSCode

## Step-by-Step Guide

### 1. Open Terminal in VSCode

**Method 1: Keyboard Shortcut**
- **Mac:** Press `Cmd + ` (Command + backtick)
- **Windows/Linux:** Press `Ctrl + ` (Control + backtick)

**Method 2: Menu**
- Go to: **Terminal** → **New Terminal** (or **Terminal** → **New Terminal**)

**Method 3: Command Palette**
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Terminal: Create New Terminal"
- Press Enter

### 2. Check if AWS CLI is Installed

In the terminal, type:
```bash
aws --version
```

**If you see a version number:** ✅ AWS CLI is installed  
**If you see "command not found":** ❌ You need to install it first

#### Install AWS CLI (if needed):

**On macOS:**
```bash
brew install awscli
```

**On Windows:**
- Download from: https://aws.amazon.com/cli/
- Or use: `winget install Amazon.AWSCLI`

**On Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 3. Configure AWS CLI (First Time Only)

Run this command:
```bash
aws configure
```

You'll be prompted to enter:
1. **AWS Access Key ID:** (Get this from AWS Console → IAM → Users → Your User → Security Credentials)
2. **AWS Secret Access Key:** (Same place as above)
3. **Default region name:** `us-east-1` (or your preferred region)
4. **Default output format:** `json` (just press Enter)

**Example:**
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

### 4. Verify AWS Configuration

Test that it works:
```bash
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

If you see this, ✅ You're ready to go!

### 5. Navigate to Your Project Directory

If you're not already in the project directory:
```bash
cd /Users/selva/Projects/TimePulse
```

Or if you're already in VSCode with the project open, you should already be in the right directory.

### 6. Run Commands

#### Option A: Run Individual Commands

Just type the command and press Enter. For example:

```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier timepulse-db

# List App Runner services
aws apprunner list-services

# Check your AWS account
aws sts get-caller-identity
```

#### Option B: Use the Helper Script

Run the interactive script:
```bash
./scripts/aws-deploy.sh
```

**If you get "Permission denied":**
```bash
chmod +x scripts/aws-deploy.sh
./scripts/aws-deploy.sh
```

The script will show a menu:
```
What would you like to do?
1) Check deployment status
2) Create RDS database
3) Create secrets
4) Create ECR repository
5) Build and push Python Engine Docker image
6) Create App Runner service for Python Engine
7) Get service URLs
8) Run database migrations
9) Full deployment (all steps)

Enter choice [1-9]:
```

Just type the number and press Enter!

### 7. Common Commands to Start With

#### Check Current Status
```bash
# See what you already have
aws apprunner list-services
aws rds describe-db-instances
aws secretsmanager list-secrets
```

#### Create RDS Database
```bash
aws rds create-db-instance \
  --db-instance-identifier timepulse-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password "YourPassword123!" \
  --allocated-storage 20 \
  --db-name timepulse_db \
  --publicly-accessible \
  --region us-east-1
```

**Note:** The `\` at the end of each line means "continue on next line". You can also write it all on one line without the `\`.

#### Check Database Status
```bash
aws rds describe-db-instances \
  --db-instance-identifier timepulse-db \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' \
  --output table
```

### 8. Tips for Using Terminal in VSCode

#### Split Terminal (Run Multiple Commands)
- Right-click on the terminal tab → **Split Terminal**
- Or use the `+` button next to the terminal tab

#### Copy/Paste
- **Mac:** `Cmd+C` to copy, `Cmd+V` to paste
- **Windows/Linux:** `Ctrl+C` to copy, `Ctrl+V` to paste
- Or right-click → Copy/Paste

#### Clear Terminal
- Type: `clear` and press Enter
- Or: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)

#### Scroll Through Command History
- Press `↑` (up arrow) to see previous commands
- Press `↓` (down arrow) to go forward

#### Auto-complete
- Press `Tab` to auto-complete file/folder names
- Press `Tab` twice to see all options

### 9. Example: Complete Workflow

Here's a complete example of running commands:

```bash
# 1. Open terminal (Cmd+` or Ctrl+`)

# 2. Check AWS is configured
aws sts get-caller-identity

# 3. Check what services exist
aws apprunner list-services

# 4. Create a secret (example)
aws secretsmanager create-secret \
  --name timepulse/test-secret \
  --secret-string "test-value"

# 5. Verify it was created
aws secretsmanager list-secrets \
  --filters Key=name,Values=timepulse

# 6. Check RDS (if exists)
aws rds describe-db-instances \
  --db-instance-identifier timepulse-db
```

### 10. Troubleshooting

#### "Command not found: aws"
- AWS CLI is not installed
- Install it using the steps in section 2

#### "Unable to locate credentials"
- Run `aws configure` to set up credentials
- Or set environment variables:
  ```bash
  export AWS_ACCESS_KEY_ID=your-key
  export AWS_SECRET_ACCESS_KEY=your-secret
  export AWS_DEFAULT_REGION=us-east-1
  ```

#### "Permission denied" when running script
```bash
chmod +x scripts/aws-deploy.sh
```

#### "No such file or directory"
- Make sure you're in the project root directory
- Check with: `pwd` (print working directory)
- Navigate with: `cd /Users/selva/Projects/TimePulse`

#### Command takes too long / Hangs
- Press `Ctrl+C` to cancel
- Some commands (like creating RDS) take 5-10 minutes
- Check status in AWS Console if needed

### 11. Quick Reference Card

```
Open Terminal:        Cmd+` (Mac) or Ctrl+` (Windows)
Check AWS CLI:        aws --version
Configure AWS:        aws configure
Test Connection:      aws sts get-caller-identity
List Services:        aws apprunner list-services
Check RDS:            aws rds describe-db-instances
Run Script:           ./scripts/aws-deploy.sh
Clear Terminal:       clear or Cmd+K
Cancel Command:       Ctrl+C
```

### 12. Visual Guide

```
┌─────────────────────────────────────────┐
│  VSCode Window                           │
│  ┌───────────────────────────────────┐  │
│  │  Editor (your code files)        │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Terminal (Cmd+` to open)         │  │
│  │  $ aws --version                   │  │
│  │  aws-cli/2.15.0                    │  │
│  │  $ aws sts get-caller-identity     │  │
│  │  { "Account": "123456789012" }     │  │
│  │  $ ./scripts/aws-deploy.sh         │  │
│  │  What would you like to do?        │  │
│  │  1) Check deployment status        │  │
│  │  ...                               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Ready to Start?

1. **Open terminal:** `Cmd+` (Mac) or `Ctrl+` (Windows)
2. **Check AWS CLI:** `aws --version`
3. **If not installed:** Install it (see section 2)
4. **Configure:** `aws configure` (first time only)
5. **Test:** `aws sts get-caller-identity`
6. **Run script:** `./scripts/aws-deploy.sh`

That's it! You're ready to deploy! 🚀

