# Fix Amplify Configuration

## 🚨 **Current Issue**

Your frontend at https://main.dolfu0p2owxyr.amplifyapp.com is still trying to connect to `localhost:5001` instead of your AWS App Runner backend.

## ✅ **Solution: Set Environment Variables in AWS Amplify**

### **Step 1: Access Amplify Console**

1. Go to: https://console.aws.amazon.com/amplify/home
2. Click on your **TimePulse** app (App ID: `dolfu0p2owxyr`)

### **Step 2: Set Environment Variables**

1. Click **"App settings"** in the left sidebar
2. Click **"Environment variables"**
3. Add/Update these variables:

| Key                  | Value                                           |
| -------------------- | ----------------------------------------------- |
| `REACT_APP_API_BASE` | `https://zewunzistm.us-east-1.awsapprunner.com` |
| `NODE_ENV`           | `production`                                    |

### **Step 3: Save and Redeploy**

1. Click **"Save"** after adding the variables
2. Go back to **"Overview"**
3. Click **"Redeploy this version"** on the main branch

### **Step 4: Verify Fix**

After redeployment (5-10 minutes), test:

- Go to: https://main.dolfu0p2owxyr.amplifyapp.com
- Try logging in with: `pushban@selsoftinc.com` / `test123#`
- Check browser console - should now show requests to AWS App Runner URL

## 🔧 **Backend Database Issue**

Your backend is running but has database connection issues. You need to:

1. **Go to AWS App Runner Console**
2. **Select `timepulse-backend` service**
3. **Go to Configuration tab**
4. **Set Environment Variables**:
   ```
   DATABASE_URL = postgresql://postgres:YOUR_PASSWORD@timepulse-cluster-instance-1.chb4yd9ykrnf.us-east-1.rds.amazonaws.com:5432/timepulse_db
   JWT_SECRET = your-jwt-secret-here
   NODE_ENV = production
   ```

## 🎯 **Expected Result**

After both fixes:

- Frontend will connect to AWS App Runner backend
- Backend will connect to AWS RDS database
- Login will work properly
- Full application will be live and functional

## 📞 **Need Help?**

If you need assistance with any of these steps, let me know!


