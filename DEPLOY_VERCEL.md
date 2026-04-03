# WorkWise — Vercel Deployment Guide

Complete step-by-step instructions to deploy WorkWise on Vercel's **free Hobby tier**.

---

## Architecture Overview

```
┌──────────────────────┐       ┌──────────────────────┐
│   FRONTEND (Vercel)  │──────▶│   BACKEND (Vercel)   │
│   React + Vite       │  API  │   Express Serverless  │
│   workwise.vercel.app│       │   workwise-api.vercel │
└──────────────────────┘       └──────────┬───────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │  DATABASE (Supabase)  │
                               │  PostgreSQL Free Tier  │
                               └──────────────────────┘
```

**Total cost: $0/month** (all free tiers)

---

## Prerequisites

- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (sign up with GitHub)
- [Supabase](https://supabase.com) account
- [Node.js](https://nodejs.org) 18+ installed locally
- Git installed locally

---

## STEP 1 — Set Up Supabase (Database)

### 1.1 Create a Supabase Project

1. Go to **https://supabase.com** → Sign up / Log in
2. Click **New Project**
3. Fill in:
   - **Project name:** `workwise`
   - **Database password:** (save this somewhere safe)
   - **Region:** Choose closest to your users (e.g., `Mumbai` for India)
4. Click **Create new project** — wait 1-2 minutes for setup

### 1.2 Create the Database Tables

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  department VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  login_time TIMESTAMPTZ,
  logout_time TIMESTAMPTZ,
  total_hours DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'absent'
    CHECK (status IN ('active', 'deficit', 'complete', 'extra', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

4. Click **Run** → You should see "Success. No rows returned"

### 1.3 Copy Your Credentials

1. Go to **Settings → API** (left sidebar → gear icon)
2. Copy and save these three values:

| What             | Where to find it                        | Example                                      |
|------------------|-----------------------------------------|-----------------------------------------------|
| **Project URL**  | Settings → API → Project URL            | `https://abcdefg.supabase.co`                |
| **Anon Key**     | Settings → API → anon public            | `eyJhbGciOiJI...` (long string)               |
| **Service Key**  | Settings → API → service_role (secret)  | `eyJhbGciOiJI...` (different long string)     |

⚠️ **Never commit these to Git or share the service_role key publicly.**

---

## STEP 2 — Prepare GitHub Repositories

You need **two separate repos** (Vercel deploys one project per repo).

### 2.1 Backend Repository

```bash
# On your local machine
mkdir workwise-api
cd workwise-api

# Copy all files from the backend/ folder into this directory
# Your structure should be:
#   workwise-api/
#   ├── src/
#   │   ├── server.js
#   │   ├── config/
#   │   ├── middleware/
#   │   ├── routes/
#   │   └── utils/
#   ├── vercel.json
#   ├── package.json
#   └── .gitignore

git init
git add .
git commit -m "Initial commit - WorkWise API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/workwise-api.git
git push -u origin main
```

### 2.2 Frontend Repository

```bash
mkdir workwise-app
cd workwise-app

# Copy all files from the frontend/ folder into this directory
# Your structure should be:
#   workwise-app/
#   ├── src/
#   │   ├── App.jsx
#   │   ├── main.jsx
#   │   ├── components/
#   │   ├── context/
#   │   ├── hooks/
#   │   └── utils/
#   ├── public/
#   ├── vercel.json
#   ├── package.json
#   ├── vite.config.js
#   ├── tailwind.config.js
#   └── index.html

git init
git add .
git commit -m "Initial commit - WorkWise Frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/workwise-app.git
git push -u origin main
```

---

## STEP 3 — Deploy Backend on Vercel

### 3.1 Import Project

1. Go to **https://vercel.com** → Log in with GitHub
2. Click **"Add New…" → Project**
3. Find and select your **`workwise-api`** repository
4. Click **Import**

### 3.2 Configure Build Settings

Vercel should auto-detect, but verify:

| Setting          | Value          |
|------------------|----------------|
| Framework Preset | Other          |
| Build Command    | (leave empty)  |
| Output Directory | (leave empty)  |
| Install Command  | `npm install`  |

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add each of these:

| Key                          | Value                                          |
|------------------------------|------------------------------------------------|
| `NODE_ENV`                   | `production`                                   |
| `JWT_SECRET`                 | *(generate one — see below)*                   |
| `JWT_EXPIRES_IN`             | `7d`                                           |
| `SUPABASE_URL`               | `https://your-project.supabase.co`             |
| `SUPABASE_ANON_KEY`          | *(your anon key from Step 1.3)*                |
| `SUPABASE_SERVICE_ROLE_KEY`  | *(your service_role key from Step 1.3)*        |
| `FRONTEND_URL`               | `https://workwise-app.vercel.app` *(update later)* |
| `REQUIRED_HOURS_PER_DAY`     | `9`                                            |

**To generate a JWT_SECRET**, run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3.4 Deploy

1. Click **Deploy**
2. Wait 1-2 minutes for the build to complete
3. Once done, you'll see a URL like: **`https://workwise-api-xxxx.vercel.app`**
4. Test it by visiting: `https://workwise-api-xxxx.vercel.app/api/health`
   - You should see: `{"status":"ok","uptime":...}`
5. **Copy this URL** — you'll need it for the frontend

---

## STEP 4 — Deploy Frontend on Vercel

### 4.1 Import Project

1. Go back to **Vercel Dashboard** → **"Add New…" → Project**
2. Select your **`workwise-app`** repository
3. Click **Import**

### 4.2 Configure Build Settings

| Setting          | Value           |
|------------------|-----------------|
| Framework Preset | Vite            |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |

### 4.3 Add Environment Variable

| Key            | Value                                           |
|----------------|--------------------------------------------------|
| `VITE_API_URL` | `https://workwise-api-xxxx.vercel.app`           |

*(Use the backend URL from Step 3.4)*

### 4.4 Deploy

1. Click **Deploy**
2. Wait 1-2 minutes
3. Your app is live at: **`https://workwise-app-xxxx.vercel.app`**

---

## STEP 5 — Update Backend CORS

Now that you have the frontend URL, go back and update the backend:

1. Go to **Vercel Dashboard → workwise-api project**
2. Click **Settings → Environment Variables**
3. Find `FRONTEND_URL` and update it to your actual frontend URL:
   ```
   https://workwise-app-xxxx.vercel.app
   ```
4. Go to **Deployments** tab → click the **⋯** menu on the latest deployment → **Redeploy**

---

## STEP 6 — Seed Demo Data (Optional)

Run this on your local machine to create a demo user with sample attendance:

```bash
cd workwise-api   # your local backend folder

# Create a .env file
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
EOF

# Install dependencies and run seed
npm install
npm run seed
```

You'll see:
```
🌱 Seeding database...
✅ Demo user created: demo@workwise.app
✅ 18 attendance records created
🎉 Seed complete!
   Login: demo@workwise.app / demo1234
```

---

## STEP 7 — Custom Domain (Optional, Free)

### Using Vercel's Free Subdomain
Your apps are already live at `*.vercel.app` — no action needed.

### Using Your Own Domain
1. Go to **Vercel → Your Project → Settings → Domains**
2. Type your domain (e.g., `workwise.yourdomain.com`)
3. Vercel will give you DNS records to add at your registrar
4. Vercel provides **free SSL** automatically

---

## Verification Checklist

After deployment, test each feature:

| #  | Test                                           | Expected Result                           |
|----|------------------------------------------------|-------------------------------------------|
| 1  | Visit frontend URL                             | Login page loads                          |
| 2  | Click "Create one" link                        | Register page loads                       |
| 3  | Register a new account                         | Redirected to dashboard                   |
| 4  | Click "Punch In"                               | Live timer starts counting                |
| 5  | Wait a moment, click "Punch Out"               | Shows total hours and status badge        |
| 6  | Check the bar chart                            | Today's bar appears                       |
| 7  | Navigate to Records page                       | Table shows today's entry                 |
| 8  | Click pencil icon on a record                  | Edit modal opens                          |
| 9  | Click Export button                            | .xlsx file downloads                      |
| 10 | Toggle dark mode (moon icon)                   | Theme switches                            |
| 11 | Open on phone browser                          | Fully responsive, hamburger menu works    |
| 12 | Login with demo@workwise.app / demo1234        | Dashboard shows sample data and chart     |

---

## Troubleshooting

### "Network Error" or "Failed to fetch"
- **Cause:** Backend URL wrong or CORS misconfigured
- **Fix:** Verify `VITE_API_URL` in frontend matches your backend URL exactly (no trailing slash). Verify `FRONTEND_URL` in backend matches your frontend URL exactly.

### "Cannot find module" on Vercel build
- **Cause:** Dependencies not in `package.json`
- **Fix:** Run `npm install` locally, verify it works, then push

### Backend returns 500 errors
- **Cause:** Supabase credentials incorrect
- **Fix:** Double-check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars. Make sure you ran the SQL schema.

### "FUNCTION_INVOCATION_TIMEOUT"
- **Cause:** Vercel Hobby has a 10-second function timeout
- **Fix:** This is usually a cold start issue. Retry after a few seconds. If persistent, ensure your Supabase region is close to your Vercel region.

### Blank page after deploy
- **Cause:** SPA routing not configured
- **Fix:** Ensure `vercel.json` exists in the frontend repo with the rewrite rule.

### After redeploy, old version still showing
- **Fix:** Hard refresh browser (Ctrl+Shift+R) or clear cache.

---

## Environment Variables Summary

### Backend (workwise-api on Vercel)

| Variable                     | Required | Example                                  |
|------------------------------|----------|------------------------------------------|
| `NODE_ENV`                   | Yes      | `production`                             |
| `JWT_SECRET`                 | Yes      | `a1b2c3d4e5...` (random 64+ chars)      |
| `JWT_EXPIRES_IN`             | No       | `7d` (default)                           |
| `SUPABASE_URL`               | Yes      | `https://xyz.supabase.co`               |
| `SUPABASE_ANON_KEY`          | Yes      | `eyJ...`                                 |
| `SUPABASE_SERVICE_ROLE_KEY`  | Yes      | `eyJ...`                                 |
| `FRONTEND_URL`               | Yes      | `https://workwise-app.vercel.app`        |
| `REQUIRED_HOURS_PER_DAY`     | No       | `9` (default)                            |

### Frontend (workwise-app on Vercel)

| Variable       | Required | Example                                   |
|----------------|----------|-------------------------------------------|
| `VITE_API_URL` | Yes      | `https://workwise-api.vercel.app`         |

---

## Vercel Free Tier Limits

| Resource                 | Hobby (Free) Limit     |
|--------------------------|------------------------|
| Deployments              | Unlimited              |
| Bandwidth                | 100 GB / month         |
| Serverless function time | 100 GB-hours / month   |
| Function duration        | 10 seconds max         |
| Builds                   | 6000 minutes / month   |
| Team members             | 1 (personal)           |

For a small team time tracker, these limits are more than sufficient.

---

*Guide created for WorkWise v1.0 — April 2026*
