# WorkWise — Employee Time Tracking System

A production-ready, multi-user web application for tracking employee login/logout time, calculating working hours, and generating monthly reports. Fully responsive, works on mobile, tablet, and desktop.

---

## Tech Stack

| Layer      | Technology                | Free Tier         |
|------------|---------------------------|-------------------|
| Frontend   | React 18 + Vite + Tailwind CSS | Netlify (free)    |
| Backend    | Node.js + Express         | Render (free)     |
| Database   | PostgreSQL                | Supabase (free)   |
| Auth       | JWT + bcrypt              | —                 |
| Charts     | Recharts                  | —                 |
| Export     | SheetJS (xlsx)            | —                 |

**Total cost: $0/month**

---

## Folder Structure

```
workwise/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.js          # Supabase client
│   │   │   └── schema.sql           # Database schema
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js              # Register/Login/Profile
│   │   │   └── attendance.js        # Punch In/Out, Monthly, Export
│   │   ├── utils/
│   │   │   ├── dateHelpers.js       # Date/time calculations
│   │   │   └── seed.js              # Demo data seeder
│   │   └── server.js                # Express entry point
│   ├── .env.example
│   ├── render.yaml                  # Render deployment config
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── attendance/
│   │   │   │   └── Records.jsx
│   │   │   └── shared/
│   │   │       └── AppShell.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useDarkMode.js
│   │   ├── utils/
│   │   │   ├── api.js               # Axios client
│   │   │   └── helpers.js           # Formatters
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── netlify.toml                 # Netlify deployment config
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## Database Schema

### `users` table

| Column        | Type         | Constraints            |
|---------------|--------------|------------------------|
| id            | UUID (PK)    | auto-generated         |
| name          | VARCHAR(100) | NOT NULL               |
| email         | VARCHAR(255) | UNIQUE, NOT NULL       |
| password_hash | TEXT         | NOT NULL               |
| department    | VARCHAR(100) | DEFAULT 'General'      |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()          |

### `attendance` table

| Column      | Type          | Constraints                                     |
|-------------|---------------|-------------------------------------------------|
| id          | UUID (PK)     | auto-generated                                  |
| user_id     | UUID (FK)     | REFERENCES users(id) ON DELETE CASCADE          |
| date        | DATE          | NOT NULL                                        |
| login_time  | TIMESTAMPTZ   | nullable                                        |
| logout_time | TIMESTAMPTZ   | nullable                                        |
| total_hours | DECIMAL(5,2)  | DEFAULT 0                                       |
| status      | VARCHAR(20)   | CHECK (active, deficit, complete, extra, absent) |
| created_at  | TIMESTAMPTZ   | DEFAULT NOW()                                   |
| **UNIQUE**  |               | (user_id, date) — one record per user per day   |

---

## API Documentation

### Auth Routes

| Method | Endpoint          | Auth | Body                                     | Response                    |
|--------|-------------------|------|------------------------------------------|-----------------------------|
| POST   | /api/auth/register | No   | `{name, email, password, department?}`   | `{user, token}`             |
| POST   | /api/auth/login    | No   | `{email, password}`                      | `{user, token}`             |
| GET    | /api/auth/me       | Yes  | —                                        | `{user}`                    |

### Attendance Routes (all require Bearer token)

| Method | Endpoint                | Body                          | Response                        |
|--------|-------------------------|-------------------------------|---------------------------------|
| POST   | /api/attendance/punch-in | —                             | `{message, record}`             |
| POST   | /api/attendance/punch-out| —                             | `{message, record}`             |
| GET    | /api/attendance/today    | —                             | `{record, isWeekend, date}`     |
| GET    | /api/attendance/monthly  | Query: `year`, `month`        | `{records[], summary}`          |
| GET    | /api/attendance/range    | Query: `from`, `to`           | `{records[]}`                   |
| PUT    | /api/attendance/:id      | `{login_time?, logout_time?}` | `{message, record}`             |
| GET    | /api/attendance/export   | Query: `year`, `month`        | `.xlsx` file download           |

### Monthly Summary Object

```json
{
  "year": 2025,
  "month": 6,
  "totalWorkingDays": 21,
  "workingDaysTillToday": 15,
  "totalRequiredHours": 189,
  "requiredTillToday": 135,
  "totalWorkedHours": 128.5,
  "remaining": 6.5,
  "extra": 0,
  "daysPresent": 14,
  "daysAbsent": 1,
  "daysWithDeficit": 3,
  "daysComplete": 11,
  "requiredHoursPerDay": 9
}
```

---

## Business Logic

- **Working day** = Monday–Friday (weekends excluded dynamically)
- **Daily required** = 9 hours
- **Monthly required** = Working days in month × 9
- **Status rules:**
  - `active` — punched in, not yet punched out
  - `deficit` — total hours < 9
  - `complete` — total hours = 9
  - `extra` — total hours > 9
  - `absent` — no punch-in record

---

## Deployment Guide (100% Free)

### Step 1: Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → name it `workwise` → set a database password → choose a region close to you
3. Wait for the project to be created (1-2 minutes)
4. Go to **SQL Editor** → click **New Query**
5. Copy the entire contents of `backend/src/config/schema.sql` and paste it into the editor
6. Click **Run** — you should see "Success" for both tables
7. Go to **Settings → API** and copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Deploy Backend on Render

1. Push the `backend/` folder to a GitHub repository (e.g., `workwise-api`)
2. Go to [render.com](https://render.com) and create a free account
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Name:** `workwise-api`
   - **Region:** closest to you (e.g., Singapore for India)
   - **Branch:** `main`
   - **Root Directory:** leave blank (or `backend` if monorepo)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. Add **Environment Variables:**

   | Key                        | Value                                   |
   |----------------------------|-----------------------------------------|
   | `NODE_ENV`                 | `production`                            |
   | `PORT`                     | `5000`                                  |
   | `JWT_SECRET`               | (generate a random 64-char string)      |
   | `JWT_EXPIRES_IN`           | `7d`                                    |
   | `SUPABASE_URL`             | (from Step 1)                           |
   | `SUPABASE_ANON_KEY`        | (from Step 1)                           |
   | `SUPABASE_SERVICE_ROLE_KEY`| (from Step 1)                           |
   | `FRONTEND_URL`             | `https://your-app.netlify.app`          |
   | `REQUIRED_HOURS_PER_DAY`   | `9`                                     |

7. Click **Create Web Service** — wait for deployment
8. Note your backend URL: `https://workwise-api.onrender.com`

### Step 3: Seed Demo Data (Optional)

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run seed
```

### Step 4: Deploy Frontend on Netlify

1. Push the `frontend/` folder to a GitHub repository (e.g., `workwise-app`)
2. Go to [netlify.com](https://netlify.com) and create a free account
3. Click **Add New Site → Import from Git**
4. Connect your GitHub repo
5. Configure:
   - **Branch:** `main`
   - **Base directory:** leave blank (or `frontend` if monorepo)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Add **Environment Variable:**

   | Key            | Value                                    |
   |----------------|------------------------------------------|
   | `VITE_API_URL` | `https://workwise-api.onrender.com`      |

7. Click **Deploy Site**
8. After deployment, go to **Site Settings → Domain** to see your URL
9. **IMPORTANT:** Go back to Render and update the `FRONTEND_URL` env var to match your Netlify URL

### Step 5: Verify

1. Visit your Netlify URL
2. Register a new account or login with demo credentials:
   - **Email:** `demo@workwise.app`
   - **Password:** `demo1234`
3. Test: Punch In → wait → Punch Out → check Dashboard → check Records → Export Excel

---

## Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
# Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# For local dev, VITE_API_URL can be empty (Vite proxy handles it)
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Features

- [x] Multi-user authentication (JWT + bcrypt)
- [x] Punch In / Punch Out with live timer
- [x] Auto-calculate daily hours and status
- [x] Monthly dashboard with progress bar and chart
- [x] Date-wise tabular records with filters
- [x] Edit entries
- [x] Excel export (daily records + monthly summary)
- [x] Dark mode
- [x] Fully responsive (mobile-first)
- [x] Weekend detection
- [x] Rate limiting and security headers

---

## Demo Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | demo@workwise.app  |
| Password | demo1234           |

*(Run `npm run seed` in the backend to create this user with sample data)*
