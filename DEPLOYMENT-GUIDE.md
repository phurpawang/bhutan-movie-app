# Deploying Bhutan Movie App to Render

## Step-by-Step Deployment Guide

### Prerequisites
1. GitHub account (create at https://github.com if you don't have one)
2. Render account (sign up at https://render.com with your GitHub account)
3. Your Railway MySQL database is already set up ✅

---

## Part 1: Push Your Code to GitHub

### 1. Create a GitHub Repository

1. Go to https://github.com
2. Click the **+** button (top right) → **New repository**
3. Repository name: `bhutan-movie-app`
4. Keep it **Public** (required for free Render hosting)
5. Click **Create repository**

### 2. Upload Your Code to GitHub

Open PowerShell in your project folder and run these commands:

```powershell
cd C:\Users\pwang\bhutan-movie-appp

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment setup"

# Add your GitHub repository
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/bhutan-movie-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note:** You'll need to enter your GitHub username and password (or personal access token).

---

## Part 2: Deploy Backend to Render

### 1. Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Click **Connect** next to your `bhutan-movie-app` repository
4. Configure:
   - **Name:** `bhutan-movie-backend`
   - **Region:** Singapore (closest to Bhutan)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### 2. Add Environment Variables

In the **Environment** section, add these variables:

```
DB_HOST=interchange.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=ZbgBvKvMpNmyFMhHygSeKEZEdDCFAPnC
DB_NAME=movie_app
PORT=5001
NODE_ENV=production
```

### 3. Deploy

1. Click **Create Web Service**
2. Wait 5-10 minutes for deployment
3. Once deployed, you'll get a URL like: `https://bhutan-movie-backend.onrender.com`

### 4. Test Your Deployment

Open browser and visit: `https://bhutan-movie-backend.onrender.com/health`

You should see: `{"status":"ok"}`

---

## Part 3: Update Mobile App Configuration

### Update API URL in Your App

1. Open `constants/api.ts`
2. Replace the backend URL with your Render URL:

```typescript
export const BACKEND_API_URL = "https://bhutan-movie-backend.onrender.com/api";
```

3. Also update `constants/api.js` if it exists

### Rebuild Your Mobile App

```powershell
# In your project root
npx expo start --clear
```

---

## Part 4: Deploy Admin Panel to Render (Optional)

### 1. Deploy Admin Server

1. In Render Dashboard → **New +** → **Web Service**
2. Select your repository
3. Configure:
   - **Name:** `bhutan-movie-admin-server`
   - **Root Directory:** `admin/server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. Add environment variables:
```
DB_HOST=interchange.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=ZbgBvKvMpNmyFMhHygSeKEZEdDCFAPnC
DB_NAME=movie_app
PORT=5000
NODE_ENV=production
```

### 2. Deploy Admin Frontend

1. In Render Dashboard → **New +** → **Static Site**
2. Select your repository
3. Configure:
   - **Name:** `bhutan-movie-admin`
   - **Root Directory:** `admin`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Add environment variable:
```
VITE_ADMIN_API=https://bhutan-movie-admin-server.onrender.com
```

---

## Final Result

After deployment, you'll have:

✅ **Backend API:** `https://bhutan-movie-backend.onrender.com`
   - Works 24/7 from anywhere
   - Mobile app can connect from any WiFi/mobile data

✅ **Admin Server:** `https://bhutan-movie-admin-server.onrender.com`
   - Always available

✅ **Admin Panel:** `https://bhutan-movie-admin.onrender.com`
   - Access from any browser, anywhere

✅ **Database:** Railway MySQL (already set up)
   - All data stored permanently

---

## Important Notes

### Free Tier Limitations

- **Render Free Plan:** Services sleep after 15 minutes of inactivity
- **First request after sleep:** Takes 30-60 seconds to wake up
- **Solution:** Keep services active by pinging them every 10 minutes (I can set this up)

### Costs

- **Everything is FREE** ✅
- Render: Free tier (no credit card needed)
- Railway MySQL: Free tier (you already have this)

---

## Troubleshooting

**Problem: Build fails on Render**
- Check logs in Render dashboard
- Ensure all dependencies are in `package.json`

**Problem: Can't connect to database**
- Verify environment variables are correct
- Check Railway database is running

**Problem: App shows "Backend unavailable"**
- Wait 60 seconds (service might be waking up)
- Check backend URL in `constants/api.ts`

---

## Need Help?

Let me know at which step you need assistance!
