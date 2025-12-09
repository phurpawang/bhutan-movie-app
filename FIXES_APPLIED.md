# Database and Server Fixes Applied

## Issues Fixed

1. **Missing Database Columns**: Added required columns to the `movies` table:
   - `genre` (VARCHAR)
   - `actors` (JSON)
   - `user_id` (VARCHAR)
   - `status` (VARCHAR)
   - `updated_at` (TIMESTAMP)

2. **Missing API Endpoints**: Added missing routes to the admin server (`admin/server/index.js`):
   - `GET /api/stats` - Get statistics (user count, movie count, pending count)
   - `GET /api/movies` - Get all movies
   - `POST /api/movies` - Add new movie
   - `PUT /api/movies/:id` - Update movie
   - `DELETE /api/movies/:id` - Delete movie
   - `GET /api/users` - Get all users

## Required Actions

### 1. Stop All Running Servers

First, you need to stop all currently running Node.js servers. You have multiple node processes running.

**Option A: Stop all Node processes (easiest)**
```powershell
Stop-Process -Name node -Force
```

**Option B: Stop specific terminals**
- Find and close the terminals running:
  - Backend server (backend/server.js)
  - Admin server (admin/server/index.js)
  - Admin frontend (admin Vite dev server)

### 2. Restart Servers in the Correct Order

#### Step 1: Start Backend Server
```powershell
cd c:\Users\pwang\bhutan-movie-appp\backend
npm start
# Or use: npm run dev (for auto-reload with nodemon)
```
Wait until you see: `Backend API listening on port 5000` (or your configured port)

#### Step 2: Start Admin Server
```powershell
# Open a NEW terminal window
cd c:\Users\pwang\bhutan-movie-appp\admin\server
npm start
# Or use: npm run dev (for auto-reload with nodemon)
```
Wait until you see: `Server running at http://localhost:5000`

**NOTE**: Both backend and admin server run on port 5000. Make sure they're using different ports or only run one at a time. Check your `.env` files to configure different ports if needed.

#### Step 3: Start Admin Frontend
```powershell
# Open a NEW terminal window
cd c:\Users\pwang\bhutan-movie-appp\admin
npm run dev
```
Wait until you see the Vite server URL (e.g., `http://localhost:5173`)

### 3. Test the Fixes

After restarting the servers:

1. **Login to Admin Panel**
   - Go to the admin panel URL (e.g., http://localhost:5173)
   - Login with your admin credentials

2. **Check Dashboard**
   - You should now see statistics (user count, movie count)

3. **View Movies List**
   - Navigate to the movies page
   - You should see all existing movies

4. **Add New Movie**
   - Try adding a new movie through the admin panel
   - It should now save to the database

5. **Add New User**
   - Register a new user through the app
   - The user should appear in the database and admin panel

## Database Structure

The `movies` table now has the following structure:
- `movie_id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `title` (VARCHAR)
- `description` (TEXT)
- `genre_id` (INT) - old field, still present
- `year` (INT)
- `genre` (VARCHAR) - new field
- `poster_url` (VARCHAR)
- `trailer_url` (VARCHAR)
- `actors` (JSON) - new field
- `user_id` (VARCHAR) - new field
- `status` (VARCHAR, DEFAULT 'pending') - new field
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP) - new field

## Files Modified

1. `admin/server/index.js` - Added API endpoints for movies, stats, and users
2. `backend/movies` table - Added missing columns
3. `backend/update_schema.js` - Created (can be deleted after verification)

## Troubleshooting

If you still have issues:

1. **Check database connection**: Verify `.env` files in both `backend/` and `admin/server/` have correct database credentials
2. **Check server logs**: Look for any error messages when starting the servers
3. **Verify table structure**: Run `DESCRIBE movies;` in your MySQL database to confirm all columns exist
4. **Check port conflicts**: Make sure ports 5000, 5173, etc. are not being used by other applications
