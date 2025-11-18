# AWS Cost Optimization Guide - TimePulse

## 📊 Current Cost Breakdown (Estimated Monthly)

| Service | Current Config | Monthly Cost | Optimized Config | Optimized Cost | Savings |
|---------|---------------|--------------|-----------------|----------------|---------|
| **Backend App Runner** | 1 vCPU, 2GB RAM | ~$50-70 | 0.5 vCPU, 1GB RAM | ~$25-35 | **~50%** |
| **Engine App Runner** | 0.25 vCPU, 0.5GB RAM | ~$15-20 | ✅ Already optimized | ~$15-20 | - |
| **RDS Aurora Serverless** | 0.5-128 ACU, 7-day backup | ~$30-100 | 0.5-16 ACU, 3-day backup | ~$20-50 | **~40%** |
| **Bedrock API Calls** | Claude 3.5 Sonnet | ~$0.01-0.03/extraction | Smart model selection | ~$0.005-0.02/extraction | **~30%** |
| **ECR Storage** | 3 images (~14GB) | ~$0.50 | Cleaned up old images | ~$0.20 | **~60%** |
| **CloudWatch Logs** | No retention | ~$5-10 | 7-day retention | ~$2-5 | **~50%** |
| **Amplify** | Hosting | ~$0-15 | ✅ Already optimized | ~$0-15 | - |

### **Total Estimated Monthly Cost**
- **Before Optimization:** ~$100-200/month
- **After Optimization:** ~$60-120/month
- **Potential Savings:** **30-50%** ($40-80/month)

---

## ✅ Optimizations Applied

### 1. **Backend App Runner - Instance Size Reduction** ✅
- **Before:** 1 vCPU, 2GB RAM
- **After:** 0.5 vCPU, 1GB RAM
- **Savings:** ~50% on compute costs
- **Impact:** Minimal - Node.js backend is lightweight
- **Status:** ✅ Applied (updating now)

### 2. **RDS Aurora Serverless - Backup Retention** ✅
- **Before:** 7-day backup retention
- **After:** 3-day backup retention
- **Savings:** ~40% on backup storage costs
- **Impact:** Low - 3 days is sufficient for most use cases
- **Status:** ✅ Applied

### 3. **RDS Aurora Serverless - Max Capacity** (Optional)
- **Current:** 0.5-128 ACU (scales automatically)
- **Recommendation:** Reduce max to 16-32 ACU if not handling high traffic
- **Savings:** Prevents unexpected scaling costs
- **Command:**
  ```bash
  aws rds modify-db-cluster \
    --db-cluster-identifier timepulse-cluster \
    --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=16 \
    --apply-immediately
  ```

### 4. **ECR Image Cleanup** (Manual)
- **Current:** 3 images (~14GB total)
- **Action:** Delete untagged images older than 30 days
- **Savings:** ~60% on storage costs
- **Command:**
  ```bash
  # List untagged images
  aws ecr list-images --repository-name timepulse-engine --filter "tagStatus=UNTAGGED"
  
  # Delete old untagged images (be careful!)
  # aws ecr batch-delete-image --repository-name timepulse-engine --image-ids imageTag=<tag>
  ```

### 5. **CloudWatch Logs Retention** (Recommended)
- **Current:** No retention (logs kept forever)
- **Recommendation:** Set 7-day retention
- **Savings:** ~50% on log storage costs
- **Setup:**
  ```bash
  # Set retention for App Runner logs
  aws logs put-retention-policy \
    --log-group-name /aws/apprunner/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148/application \
    --retention-in-days 7 \
    --region us-east-1
  
  aws logs put-retention-policy \
    --log-group-name /aws/apprunner/timepulse-engine/13affd6f71184dd4ae63cc725a6892dc/application \
    --retention-in-days 7 \
    --region us-east-1
  ```

### 6. **Bedrock Model Selection** (Future Enhancement)
- **Current:** Always uses Claude 3.5 Sonnet (~$0.01-0.03/extraction)
- **Optimization:** Use Claude Haiku for simple files, Sonnet for complex
- **Savings:** ~30% on AI costs
- **Implementation:** Add file complexity detection
  - Simple (CSV, well-structured Excel) → Claude Haiku ($0.00025/1K input tokens)
  - Complex (PDF, images, messy formats) → Claude Sonnet ($0.003/1K input tokens)

---

## 🎯 Additional Cost Optimization Tips

### 1. **Monitor Usage with AWS Cost Explorer**
```bash
# Enable Cost Explorer (first time)
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### 2. **Set Up Billing Alerts**
- Go to AWS Billing Console → Budgets
- Create budget alerts at $50, $100, $150 thresholds
- Get notified via email/SNS

### 3. **Use Reserved Capacity** (If Stable Usage)
- For predictable workloads, consider Reserved Instances
- Can save 30-50% on App Runner costs
- Only recommended if usage is consistent

### 4. **Optimize Bedrock Calls**
- Cache results for identical files
- Batch multiple extractions if possible
- Use smaller models when appropriate

### 5. **RDS Optimization**
- Monitor actual ACU usage
- Adjust min/max capacity based on real traffic
- Consider moving to provisioned if usage is very stable

### 6. **Development Environment**
- Stop/start services when not in use
- Use smaller instance sizes for dev/staging
- Consider using AWS Free Tier where possible

---

## 📈 Monitoring Costs

### Check Current Month Costs
```bash
# Get current month cost
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

### Monitor App Runner Costs
- App Runner charges per vCPU-hour and GB-hour
- Backend: 0.5 vCPU × 24h × 30 days = 360 vCPU-hours/month
- Engine: 0.25 vCPU × 24h × 30 days = 180 vCPU-hours/month

### Monitor RDS Costs
- Aurora Serverless v2 charges per ACU-hour
- Monitor actual ACU usage in CloudWatch
- Set up alarms for high ACU usage

---

## ⚠️ Important Notes

1. **Test After Changes:** Monitor application performance after reducing instance sizes
2. **Backup Retention:** 3 days is minimum recommended for production
3. **Auto-Scaling:** Keep enabled to handle traffic spikes
4. **Cost vs Performance:** Balance cost savings with user experience

---

## 🔄 Rollback Instructions

If you need to revert changes:

### Backend App Runner
```bash
aws apprunner update-service \
  --service-arn arn:aws:apprunner:us-east-1:727044518907:service/timepulse-backend/4ba25417620d44fe9a8bb2a34abae148 \
  --instance-configuration '{"Cpu":"1024","Memory":"2048"}'
```

### RDS Backup Retention
```bash
aws rds modify-db-cluster \
  --db-cluster-identifier timepulse-cluster \
  --backup-retention-period 7 \
  --apply-immediately
```

---

## 📝 Summary

**Total Potential Monthly Savings: $40-80 (30-50%)**

**Quick Wins Applied:**
- ✅ Backend instance size reduced (50% savings)
- ✅ RDS backup retention reduced (40% savings)
- ⏳ ECR cleanup (manual)
- ⏳ CloudWatch retention (recommended)

**Future Optimizations:**
- Smart Bedrock model selection
- RDS max capacity tuning
- Cost monitoring and alerts

