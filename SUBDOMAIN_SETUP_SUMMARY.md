# Subdomain Setup Summary - app.timepulse.io

**Date:** November 9, 2025  
**Status:** ✅ Configured - PENDING_DEPLOYMENT

## What Was Done

### 1. Created Subdomain Hosted Zone
- **Zone Name:** `app.timepulse.io`
- **Zone ID:** `Z06325592BODYJWNIYXY6`
- **Type:** Public hosted zone
- **NS Records:**
  - ns-1817.awsdns-35.co.uk.
  - ns-733.awsdns-27.net.
  - ns-433.awsdns-54.com.
  - ns-1204.awsdns-22.org.

### 2. Delegated Subdomain in Parent Zone
- **Parent Zone:** `timepulse.io` (Z07671233RDCPZQ9J6965)
- **Action:** Created NS record in parent zone pointing to subdomain zone
- **Status:** ✅ Completed

### 3. Removed Conflicting CNAME
- **Action:** Removed existing CNAME record for `app.timepulse.io` in parent zone
- **Status:** ✅ Completed

### 4. Created ALIAS Record to CloudFront
- **Record Type:** A (ALIAS)
- **Target:** `d2qao2skrlktc5.cloudfront.net`
- **Hosted Zone ID:** Z2FDTNDATAQYW2 (CloudFront)
- **Status:** ✅ Completed

### 5. Associated Domain with Amplify
- **Amplify App ID:** `dolfu0p2owxyr`
- **Domain:** `timepulse.io`
- **Subdomain:** `app`
- **Branch:** `main`
- **Status:** ✅ Associated - PENDING_DEPLOYMENT

## Current Status

- **Domain Status:** `PENDING_DEPLOYMENT`
- **Subdomain Verified:** `False` (pending DNS validation)
- **DNS Record:** `app CNAME d2qao2skrlktc5.cloudfront.net`

## DNS Configuration

### Parent Zone (timepulse.io)
- NS record for `app.timepulse.io` → Delegates to subdomain zone

### Subdomain Zone (app.timepulse.io)
- A (ALIAS) record for `app.timepulse.io` → Points to CloudFront distribution

## Next Steps

1. **Wait for DNS Propagation** (5-30 minutes)
   - DNS changes need time to propagate globally
   - Check status: `aws amplify get-domain-association --app-id dolfu0p2owxyr --domain-name timepulse.io --region us-east-2`

2. **Monitor Domain Status**
   ```bash
   aws amplify get-domain-association \
     --app-id dolfu0p2owxyr \
     --domain-name timepulse.io \
     --region us-east-2 \
     --query 'domainAssociation.[domainName,domainStatus,subDomains[0].verified]' \
     --output table
   ```

3. **Verify DNS Resolution**
   ```bash
   dig app.timepulse.io
   dig app.timepulse.io A
   curl -I https://app.timepulse.io
   ```

4. **Once Verified**
   - Domain status will change to `AVAILABLE`
   - `app.timepulse.io` will be accessible via HTTPS
   - SSL certificate will be automatically provisioned by AWS Certificate Manager

## Expected Timeline

- **DNS Propagation:** 5-30 minutes
- **SSL Certificate Provisioning:** 5-15 minutes (after DNS validation)
- **Total Time:** 10-45 minutes

## Verification Commands

### Check Domain Status
```bash
aws amplify get-domain-association \
  --app-id dolfu0p2owxyr \
  --domain-name timepulse.io \
  --region us-east-2 \
  --query 'domainAssociation.[domainName,domainStatus,subDomains[0].subDomainSetting.prefix,subDomains[0].verified]' \
  --output table
```

### Check DNS Records
```bash
# Check NS delegation
dig NS app.timepulse.io +short

# Check A record
dig app.timepulse.io A +short

# Full DNS trace
dig +trace app.timepulse.io
```

### Test HTTPS
```bash
curl -I https://app.timepulse.io
```

## Troubleshooting

If domain status remains `PENDING_VERIFICATION` or `PENDING_DEPLOYMENT` for more than 30 minutes:

1. **Check DNS Records:**
   ```bash
   aws route53 list-resource-record-sets \
     --hosted-zone-id Z06325592BODYJWNIYXY6 \
     --query "ResourceRecordSets[?Type=='A' || Type=='NS']" \
     --output json
   ```

2. **Verify NS Delegation:**
   ```bash
   dig NS app.timepulse.io +short
   # Should return the 4 NS records from the subdomain zone
   ```

3. **Check Amplify Domain Association:**
   ```bash
   aws amplify get-domain-association \
     --app-id dolfu0p2owxyr \
     --domain-name timepulse.io \
     --region us-east-2
   ```

## Summary

✅ Subdomain zone created and configured  
✅ NS delegation set up in parent zone  
✅ ALIAS record pointing to CloudFront created  
✅ Domain associated with Amplify  
⏳ Waiting for DNS propagation and SSL certificate provisioning  

**Once complete, `app.timepulse.io` will be accessible via HTTPS!**
