-- ============================================
-- WorkWise Database Schema (Supabase/PostgreSQL)
-- Run this in Supabase SQL Editor
-- ============================================

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
  
  -- One record per user per day
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Row Level Security (RLS) Policies
-- NOTE: Since we use service_role key from backend, RLS is bypassed.
-- If you want to also use Supabase client directly from frontend,
-- enable these policies:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own profile" ON users
--   FOR SELECT USING (auth.uid()::text = id::text);

-- CREATE POLICY "Users can view own attendance" ON attendance
--   FOR SELECT USING (auth.uid()::text = user_id::text);

-- CREATE POLICY "Users can insert own attendance" ON attendance
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- CREATE POLICY "Users can update own attendance" ON attendance
--   FOR UPDATE USING (auth.uid()::text = user_id::text);
