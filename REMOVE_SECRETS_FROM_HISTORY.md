# Remove Secrets from Git History

## ⚠️ Important

Secrets were committed to git history in these commits:
- `ee83547` - FIX_SES_SMTP_CREDENTIALS.md
- `6b9b18e` - SES_SETUP_STATUS.md  
- `41ab413` - TIMEPULSE_IO_SES_SETUP_COMPLETE.md

GitHub push protection scans the entire history, so we need to remove secrets from history.

---

## ✅ Option 1: Allow Secret in GitHub (Quick Fix)

If you just need to push now:

1. Go to the GitHub link provided in the error:
   - Access Key: https://github.com/SelsoftInc/TimePulse/security/secret-scanning/unblock-secret/35Wvl1Ki5M7lROYutdVjzjZ4bzb
   - Secret Key: https://github.com/SelsoftInc/TimePulse/security/secret-scanning/unblock-secret/35Wvl4Q9iHV0Z9lghGT8XJFeFW3

2. Click "Allow secret" (one-time allowance)

3. Push again

**Note:** This allows the secret but doesn't remove it from history. The credentials should be rotated anyway since they're exposed.

---

## 🔧 Option 2: Remove from History (Recommended)

### Method A: Using git filter-branch

```bash
# Remove secrets from all commits
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch FIX_SES_SMTP_CREDENTIALS.md SES_SETUP_STATUS.md SES_SMTP_CREDENTIALS_GUIDE.md TIMEPULSE_IO_SES_SETUP_COMPLETE.md' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history!)
git push origin --force --all
```

### Method B: Using BFG Repo-Cleaner (Easier)

1. **Install BFG:**
   ```bash
   brew install bfg
   # Or download from: https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Create secrets.txt:**
   ```
   AKIA2SRZ26P5ZRH4EH77==>YOUR_ACCESS_KEY_ID
   rLGpb4DhvaR3oGkI1y0WKYEgrqGJYDKvkWwSbLc3==>YOUR_SECRET_ACCESS_KEY
   ```

3. **Run BFG:**
   ```bash
   bfg --replace-text secrets.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

4. **Force push:**
   ```bash
   git push origin --force --all
   ```

---

## 🔐 Option 3: Rotate Credentials (Most Secure)

Since the credentials are exposed, the most secure approach is:

1. **Delete the exposed Access Key:**
   ```bash
   aws iam delete-access-key \
     --user-name timepulse-ses-smtp-timepulse \
     --access-key-id AKIA2SRZ26P5ZRH4EH77 \
     --region us-east-1
   ```

2. **Create new Access Key:**
   ```bash
   aws iam create-access-key \
     --user-name timepulse-ses-smtp-timepulse \
     --region us-east-1
   ```

3. **Update Secrets Manager with new credentials**

4. **Then remove old secrets from git history** (Option 2)

---

## ⚠️ Warnings

- **Force push rewrites history** - Make sure you're the only one working on this branch
- **Team members** will need to re-clone or reset their local repos
- **Backup first** - Create a branch backup before rewriting history

---

## 🚀 Recommended Approach

1. **Immediate:** Allow secret in GitHub UI to unblock push
2. **Short-term:** Rotate the exposed credentials (create new Access Key)
3. **Long-term:** Remove secrets from git history using BFG or filter-branch

---

## ✅ Current Status

- ✅ Secrets removed from current files
- ✅ New commit created without secrets
- ⚠️ Secrets still exist in git history (needs cleanup)
- ⚠️ Credentials should be rotated for security


