# Bhutan Movie App - Server Setup Guide

## Quick Start

### Starting the Servers

**Double-click `start-all-servers.bat`** - This will start:
- Backend Server (port 5001) - Handles mobile app requests
- Admin Server (port 5000) - Handles admin panel authentication
- Admin Panel will be available at http://localhost:5174

The servers will run in minimized windows in the background.

### Stopping the Servers

**Double-click `stop-all-servers.bat`** - This will stop all running servers.

## Important Notes

### For Mobile App to Work:

1. **Servers MUST be running** - The mobile app needs the backend server to save data
2. **Computer and phone must be on the same WiFi network**
3. **Your computer's IP must be `192.168.2.219`** (or update `constants/api.ts` with new IP)

### Automatic Startup (Optional)

To make servers start automatically when you turn on your computer:

1. Press `Win + R`, type `shell:startup`, press Enter
2. Right-click in the folder → New → Shortcut
3. Browse to `start-all-servers.bat` in your project folder
4. Click OK → Next → Finish

Now servers will start automatically on computer startup.

### Checking if Servers are Running

Open browser and visit:
- Backend: http://192.168.2.219:5001/health (should show `{"status":"ok"}`)
- Admin Panel: http://localhost:5174

### Database

- Database: `movie_app`
- Location: MySQL on localhost
- All user accounts and movies are stored in the database
- Database persists even when servers are stopped

## Troubleshooting

**Problem: Mobile app shows "Backend unavailable"**
- Solution: Make sure servers are running (double-click `start-all-servers.bat`)
- Check if computer IP is still `192.168.2.219`

**Problem: IP address changed**
- Find new IP: Open Command Prompt, type `ipconfig`, look for IPv4 Address
- Update `constants/api.ts` and `constants/api.js` with new IP
- Restart servers

**Problem: Port already in use**
- Solution: Run `stop-all-servers.bat` then `start-all-servers.bat` again

## Server Details

### Backend Server (Port 5001)
- Handles user registration and login
- Saves movies to database
- Accessible from network: `http://192.168.2.219:5001`

### Admin Server (Port 5000)
- Handles admin authentication
- Provides admin dashboard data
- Login: username=`admin`, password=`admin123`

### Admin Frontend (Port 5174)
- Web interface at http://localhost:5174
- View users and movies
- Manage content

## What Gets Saved to Database

When servers are running:
- ✅ User registrations
- ✅ User logins
- ✅ Movies added by users
- ✅ Movie status updates from admin panel

All data persists in MySQL database even after stopping servers.
