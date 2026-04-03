/**
 * Seed script — creates a demo user and sample attendance data.
 * Run: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

async function seed() {
  console.log('🌱 Seeding database...\n');

  // 1. Create demo user
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const { data: user, error: userErr } = await supabase
    .from('users')
    .upsert([{
      name: 'Malhar Pawar',
      email: 'demo@workwise.app',
      password_hash: passwordHash,
      department: 'Engineering'
    }], { onConflict: 'email' })
    .select()
    .single();

  if (userErr) {
    console.error('Error creating user:', userErr);
    return;
  }
  console.log('✅ Demo user created:', user.email);

  // 2. Generate sample attendance for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const today = now.getDate();

  const records = [];
  for (let day = 1; day < today; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Random login between 9:00 and 10:30
    const loginHour = 9 + Math.floor(Math.random() * 1.5);
    const loginMin = Math.floor(Math.random() * 60);
    const login = new Date(year, month, day, loginHour, loginMin, 0);

    // Random work duration 7.5 to 10.5 hours
    const hoursWorked = 7.5 + Math.random() * 3;
    const logout = new Date(login.getTime() + hoursWorked * 3600 * 1000);
    const totalHours = Math.round(hoursWorked * 100) / 100;

    let status = 'deficit';
    if (totalHours >= 9) status = totalHours > 9 ? 'extra' : 'complete';

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    records.push({
      user_id: user.id,
      date: dateStr,
      login_time: login.toISOString(),
      logout_time: logout.toISOString(),
      total_hours: totalHours,
      status,
      created_at: login.toISOString()
    });
  }

  if (records.length > 0) {
    const { error: attErr } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'user_id,date' });

    if (attErr) {
      console.error('Error seeding attendance:', attErr);
      return;
    }
    console.log(`✅ ${records.length} attendance records created`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Login: demo@workwise.app / demo1234\n');
}

seed().catch(console.error);
