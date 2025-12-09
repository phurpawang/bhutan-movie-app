# Quick Start: Deploy Your App to Cloud (24/7 Access)

## What You'll Get
- ✅ App works from anywhere (any WiFi, mobile data)
- ✅ Runs 24/7 without your computer
- ✅ All data saved permanently in cloud database
- ✅ Admin panel accessible from anywhere
- ✅ **100% FREE** (no credit card needed)

---

## Step 1: Install Git (5 minutes)

1. Download Git: https://git-scm.com/download/win
2. Run the installer
3. Click **Next** on all screens (use default settings)
4. Restart PowerShell after installation

**Verify installation:**
```powershell
git --version
```
You should see: `git version 2.x.x`

---

## Step 2: Create GitHub Account (2 minutes)

1. Go to https://github.com/signup
2. Create account (use your email)
3. Verify your email
4. Done!

---

## Step 3: Push Code to GitHub (5 minutes)

Open PowerShell in your project folder:

```powershell
cd C:\Users\pwang\bhutan-movie-appp

# Configure git (first time only)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Initialize repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for deployment"

# Create repository on GitHub first, then:
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/bhutan-movie-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**When prompted for password:** Use a Personal Access Token (not your password)
- Generate token at: https://github.com/settings/tokens
- Select: `repo` scope
- Copy the token and paste it as password

---

## Step 4: Deploy to Render (10 minutes)

### A. Sign up on Render

1. Go to https://render.com
2. Click **Sign Up**
3. Choose **Sign up with GitHub**
4. Authorize Render to access your repositories

### B. Deploy Backend

1. In Render Dashboard → Click **New +** → **Web Service**
2. Find and click **Connect** on `bhutan-movie-app` repository
3. Fill in:

```
Name: bhutan-movie-backend
Region: Singapore
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

4. Click **Advanced** → **Add Environment Variable**

Add these one by one:
```
DB_HOST = interchange.proxy.rlwy.net
DB_USER = root
DB_PASSWORD = ZbgBvKvMpNmyFMhHygSeKEZEdDCFAPnC
DB_NAME = movie_app
NODE_ENV = production
```

5. Click **Create Web Service**

6. Wait 5-10 minutes for deployment

7. **Copy your backend URL** (looks like: `https://bhutan-movie-backend.onrender.com`)

---

## Step 5: Update Your Mobile App (3 minutes)

1. Open `constants/api.ts` in your project

2. Change this line:
```typescript
export const BACKEND_API_URL = "http://192.168.2.219:5001/api";
```

To this (use YOUR actual Render URL):
```typescript
export const BACKEND_API_URL = "https://bhutan-movie-backend.onrender.com/api";
```

3. Also update `constants/api.js` if it exists with the same URL

4. **Test your backend:**
   - Open browser
   - Visit: `https://bhutan-movie-backend.onrender.com/health`
   - Should see: `{"status":"ok"}`

---

## Step 6: Rebuild & Test Your App (2 minutes)

```powershell
# In your project root
npx expo start --clear
```

**Test on your phone:**
1. Scan QR code with Expo Go app
2. Create a new account
3. Add a movie
4. Check if it saves (try logging out and back in)

✅ **Done! Your app now works 24/7 from anywhere!**

---

## Accessing Admin Panel

### Quick Method (Keep Computer On)

1. Run `start-all-servers.bat`
2. Open browser: http://localhost:5174
3. Login: username=`admin`, password=`admin123`

### Cloud Method (Optional - Deploy Admin Panel)

Follow the detailed guide in `DEPLOYMENT-GUIDE.md` to deploy admin panel to cloud.

---

## Important: Free Tier Information

**Render Free Tier:**
- Services "sleep" after 15 minutes of no use
- First request after sleep takes 30-60 seconds to wake up
- This is normal and FREE forever

**For Production (Paid):**
- $7/month keeps service always awake (instant response)
- Not needed for testing/development

---

## Testing Checklist

✅ Backend URL responds: `https://your-backend.onrender.com/health`
✅ Create account on mobile app
✅ Add movie from mobile app
✅ Check admin panel - see new user and movie
✅ Close app and reopen - data still there
✅ Turn off computer - app still works!

---

## Need Help?

**Common Issues:**

1. **Git not found**
   - Install Git from https://git-scm.com/download/win
   - Restart PowerShell

2. **Build fails on Render**
   - Check "Logs" tab in Render dashboard
   - Usually missing dependency in package.json

3. **App can't connect to backend**
   - Check URL in `constants/api.ts` matches your Render URL
   - Wait 60 seconds (service might be waking up)
   - Visit the URL in browser to wake it up

4. **Database connection error**
   - Verify environment variables in Render dashboard
   - Make sure Railway MySQL is running

---

## What's Next?

Once deployed, you can:
- Download app on any Android/iOS device
- Create accounts from anywhere
- Add movies from anywhere
- Access admin panel from any browser
- All data saved permanently in Railway database

**No need to keep your computer on!** Everything runs in the cloud 24/7.
