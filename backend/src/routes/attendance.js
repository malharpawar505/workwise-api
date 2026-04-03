const express = require('express');
const XLSX = require('xlsx');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const {
  calculateHours,
  getStatus,
  isWeekend,
  getWorkingDaysInMonth,
  getWorkingDaysTillToday,
  getToday
} = require('../utils/dateHelpers');

const router = express.Router();
const REQUIRED_HOURS = parseInt(process.env.REQUIRED_HOURS_PER_DAY) || 9;

// POST /api/attendance/punch-in
router.post('/punch-in', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday();

    // Check if already punched in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      return res.status(400).json({
        error: 'Already punched in today.',
        record: existing
      });
    }

    const now = new Date().toISOString();
    const { data: record, error } = await supabase
      .from('attendance')
      .insert([{
        user_id: userId,
        date: today,
        login_time: now,
        logout_time: null,
        total_hours: 0,
        status: 'active',
        created_at: now
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Punched in successfully.', record });
  } catch (err) {
    console.error('Punch-in error:', err);
    res.status(500).json({ error: 'Failed to punch in.' });
  }
});

// POST /api/attendance/punch-out
router.post('/punch-out', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday();

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (!existing) {
      return res.status(400).json({ error: 'No punch-in record found for today.' });
    }
    if (existing.logout_time) {
      return res.status(400).json({ error: 'Already punched out today.', record: existing });
    }

    const now = new Date().toISOString();
    const totalHours = calculateHours(existing.login_time, now);
    const status = getStatus(totalHours, REQUIRED_HOURS);

    const { data: record, error } = await supabase
      .from('attendance')
      .update({
        logout_time: now,
        total_hours: totalHours,
        status: status
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Punched out successfully.', record });
  } catch (err) {
    console.error('Punch-out error:', err);
    res.status(500).json({ error: 'Failed to punch out.' });
  }
});

// GET /api/attendance/today
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getToday();

    const { data: record } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Calculate live hours if punched in but not out
    let liveRecord = record;
    if (record && record.login_time && !record.logout_time) {
      const liveHours = calculateHours(record.login_time, new Date().toISOString());
      liveRecord = { ...record, live_hours: liveHours };
    }

    res.json({
      record: liveRecord || null,
      isWeekend: isWeekend(today),
      date: today
    });
  } catch (err) {
    console.error('Today error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s record.' });
  }
});

// POST /api/attendance/manual — add entry for any date
router.post('/manual', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, login_time, logout_time } = req.body;

    if (!date || !login_time || !logout_time) {
      return res.status(400).json({ error: 'Date, login time, and logout time are required.' });
    }

    // Don't allow future dates
    const today = getToday();
    if (date > today) {
      return res.status(400).json({ error: 'Cannot add entries for future dates.' });
    }

    // Check if record already exists
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'A record already exists for this date. Use edit instead.' });
    }

    const totalHours = calculateHours(login_time, logout_time);
    const status = getStatus(totalHours, REQUIRED_HOURS);

    const { data: record, error } = await supabase
      .from('attendance')
      .insert([{
        user_id: userId,
        date,
        login_time,
        logout_time,
        total_hours: totalHours,
        status,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Entry added successfully.', record });
  } catch (err) {
    console.error('Manual entry error:', err);
    res.status(500).json({ error: 'Failed to add entry.' });
  }
});

// GET /api/attendance/monthly?year=2025&month=6
router.get('/monthly', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const { data: records, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;

    // Calculate monthly stats
    const totalWorkingDays = getWorkingDaysInMonth(year, month);
    const workingDaysTillToday = getWorkingDaysTillToday(year, month);
    const totalRequiredHours = totalWorkingDays * REQUIRED_HOURS;
    const requiredTillToday = workingDaysTillToday * REQUIRED_HOURS;

    const totalWorkedHours = (records || []).reduce((sum, r) => {
      // For active records (punched in, not out), calculate live hours
      if (r.login_time && !r.logout_time) {
        return sum + calculateHours(r.login_time, new Date().toISOString());
      }
      return sum + (r.total_hours || 0);
    }, 0);

    const roundedWorked = Math.round(totalWorkedHours * 100) / 100;
    const remaining = Math.max(0, Math.round((requiredTillToday - roundedWorked) * 100) / 100);
    const extra = Math.max(0, Math.round((roundedWorked - requiredTillToday) * 100) / 100);

    const daysPresent = (records || []).filter(r => r.login_time).length;
    const daysWithDeficit = (records || []).filter(r => r.status === 'deficit').length;
    const daysComplete = (records || []).filter(r => r.status === 'complete' || r.status === 'extra').length;

    res.json({
      records: records || [],
      summary: {
        year,
        month,
        totalWorkingDays,
        workingDaysTillToday,
        totalRequiredHours,
        requiredTillToday,
        totalWorkedHours: roundedWorked,
        remaining,
        extra,
        daysPresent,
        daysAbsent: workingDaysTillToday - daysPresent,
        daysWithDeficit,
        daysComplete,
        requiredHoursPerDay: REQUIRED_HOURS
      }
    });
  } catch (err) {
    console.error('Monthly error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly data.' });
  }
});

// GET /api/attendance/range?from=2025-01-01&to=2025-01-31
router.get('/range', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'Both from and to dates are required.' });
    }

    const { data: records, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });

    if (error) throw error;
    res.json({ records: records || [] });
  } catch (err) {
    console.error('Range error:', err);
    res.status(500).json({ error: 'Failed to fetch records.' });
  }
});

// PUT /api/attendance/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const recordId = req.params.id;
    const { login_time, logout_time } = req.body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', recordId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    const updates = {};
    if (login_time) updates.login_time = login_time;
    if (logout_time) updates.logout_time = logout_time;

    const effectiveLogin = updates.login_time || existing.login_time;
    const effectiveLogout = updates.logout_time || existing.logout_time;

    if (effectiveLogin && effectiveLogout) {
      updates.total_hours = calculateHours(effectiveLogin, effectiveLogout);
      updates.status = getStatus(updates.total_hours, REQUIRED_HOURS);
    }

    const { data: record, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Record updated.', record });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update record.' });
  }
});

// GET /api/attendance/export?year=2025&month=6
router.get('/export', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const { data: records } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('name, email, department')
      .eq('id', userId)
      .single();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build daily records sheet
    const dailyData = (records || []).map(r => ({
      'Date': r.date,
      'Day': new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' }),
      'Login Time': r.login_time ? new Date(r.login_time).toLocaleTimeString('en-IN') : '-',
      'Logout Time': r.logout_time ? new Date(r.logout_time).toLocaleTimeString('en-IN') : '-',
      'Total Hours': r.total_hours || 0,
      'Required Hours': REQUIRED_HOURS,
      'Difference': ((r.total_hours || 0) - REQUIRED_HOURS).toFixed(2),
      'Status': (r.status || 'absent').toUpperCase()
    }));

    // Build summary sheet
    const totalWorkingDays = getWorkingDaysInMonth(year, month);
    const totalWorked = (records || []).reduce((s, r) => s + (r.total_hours || 0), 0);
    const totalRequired = totalWorkingDays * REQUIRED_HOURS;

    const summaryData = [
      { 'Metric': 'Employee Name', 'Value': user?.name || 'N/A' },
      { 'Metric': 'Department', 'Value': user?.department || 'N/A' },
      { 'Metric': 'Month', 'Value': `${monthNames[month - 1]} ${year}` },
      { 'Metric': 'Total Working Days', 'Value': totalWorkingDays },
      { 'Metric': 'Days Present', 'Value': (records || []).filter(r => r.login_time).length },
      { 'Metric': 'Days Absent', 'Value': totalWorkingDays - (records || []).filter(r => r.login_time).length },
      { 'Metric': 'Total Required Hours', 'Value': totalRequired },
      { 'Metric': 'Total Worked Hours', 'Value': Math.round(totalWorked * 100) / 100 },
      { 'Metric': 'Remaining Hours', 'Value': Math.max(0, totalRequired - totalWorked).toFixed(2) },
      { 'Metric': 'Extra Hours', 'Value': Math.max(0, totalWorked - totalRequired).toFixed(2) }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(dailyData);
    const ws2 = XLSX.utils.json_to_sheet(summaryData);

    // Set column widths
    ws1['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }
    ];
    ws2['!cols'] = [{ wch: 24 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws1, 'Daily Records');
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Summary');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = `attendance_${user?.name?.replace(/\s+/g, '_') || 'report'}_${monthNames[month - 1]}_${year}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data.' });
  }
});

module.exports = router;
