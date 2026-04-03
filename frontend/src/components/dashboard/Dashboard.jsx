import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { hoursToHM, statusColor, MONTHS } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  LogIn, LogOut, Clock, CalendarDays, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Timer, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [liveHours, setLiveHours] = useState(0);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, monthlyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get(`/attendance/monthly?year=${year}&month=${month}`)
      ]);
      setToday(todayRes.data);
      setMonthly(monthlyRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live timer
  useEffect(() => {
    if (!today?.record?.login_time || today?.record?.logout_time) return;
    const interval = setInterval(() => {
      const diff = (Date.now() - new Date(today.record.login_time).getTime()) / 3600000;
      setLiveHours(Math.round(diff * 100) / 100);
    }, 1000);
    return () => clearInterval(interval);
  }, [today]);

  const punchIn = async () => {
    setPunching(true);
    try {
      await api.post('/attendance/punch-in');
      toast.success('Punched in!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to punch in.');
    } finally {
      setPunching(false);
    }
  };

  const punchOut = async () => {
    setPunching(true);
    try {
      await api.post('/attendance/punch-out');
      toast.success('Punched out!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to punch out.');
    } finally {
      setPunching(false);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get(`/attendance/export?year=${year}&month=${month}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${MONTHS[month - 1]}_${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel downloaded!');
    } catch {
      toast.error('Export failed.');
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  const rec = today?.record;
  const s = monthly?.summary;
  const isPunchedIn = rec && rec.login_time && !rec.logout_time;
  const isPunchedOut = rec && rec.logout_time;
  const isWeekend = today?.isWeekend;
  const currentHours = isPunchedIn ? liveHours : (rec?.total_hours || 0);

  // Chart data
  const chartData = (monthly?.records || []).map(r => ({
    date: r.date.slice(8),
    hours: r.total_hours || 0,
    status: r.status
  }));

  const progressPct = s ? Math.min(100, Math.round((s.totalWorkedHours / Math.max(1, s.requiredTillToday)) * 100)) : 0;

  return (
    <div className="space-y-6 animate-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-surface-300 mt-1">
          {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Punch Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Timer size={20} className="text-brand-600" />
              Today's Status
            </h2>
            {isWeekend ? (
              <p className="text-surface-300 mt-1">It's the weekend — enjoy your day off!</p>
            ) : isPunchedIn ? (
              <div className="mt-2">
                <p className="text-sm text-surface-300">Currently working</p>
                <p className="text-4xl font-bold font-mono text-brand-600 mt-1">{hoursToHM(liveHours)}</p>
                <p className="text-xs text-surface-300 mt-1">
                  Punched in at {new Date(rec.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            ) : isPunchedOut ? (
              <div className="mt-2">
                <p className="text-sm text-surface-300">Day complete</p>
                <p className="text-4xl font-bold font-mono text-emerald-600 mt-1">{hoursToHM(rec.total_hours)}</p>
                <span className={`status-badge mt-2 ${statusColor(rec.status)}`}>{rec.status}</span>
              </div>
            ) : (
              <p className="text-surface-300 mt-1">You haven't punched in yet today.</p>
            )}
          </div>

          {/* Punch buttons */}
          {!isWeekend && (
            <div className="flex gap-3 w-full sm:w-auto">
              {!rec ? (
                <button onClick={punchIn} disabled={punching} className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  Punch In
                </button>
              ) : isPunchedIn ? (
                <button onClick={punchOut} disabled={punching} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-6 py-3 transition-all">
                  <LogOut size={18} />
                  Punch Out
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-medium">Completed for today</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
          <h2 className="text-lg font-bold min-w-[160px] text-center">
            {MONTHS[month - 1]} {year}
          </h2>
          <button onClick={nextMonth} className="btn-secondary p-2"><ChevronRight size={18} /></button>
        </div>
        <button onClick={exportExcel} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Monthly Summary Cards */}
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard
            icon={<Clock size={20} />}
            label="Worked"
            value={hoursToHM(s.totalWorkedHours)}
            sub={`of ${s.requiredTillToday}h required`}
            color="brand"
          />
          <SummaryCard
            icon={<CalendarDays size={20} />}
            label="Present"
            value={`${s.daysPresent} days`}
            sub={`of ${s.workingDaysTillToday} working days`}
            color="emerald"
          />
          <SummaryCard
            icon={s.remaining > 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
            label={s.extra > 0 ? 'Extra' : 'Remaining'}
            value={hoursToHM(s.extra > 0 ? s.extra : s.remaining)}
            sub={s.extra > 0 ? 'overtime this month' : 'to meet target'}
            color={s.extra > 0 ? 'emerald' : 'amber'}
          />
          <SummaryCard
            icon={<AlertCircle size={20} />}
            label="Deficit Days"
            value={s.daysWithDeficit}
            sub={`${s.daysAbsent} absent`}
            color="red"
          />
        </div>
      )}

      {/* Progress Bar */}
      {s && (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-surface-300">Monthly Progress</span>
            <span className="text-sm font-bold">{progressPct}%</span>
          </div>
          <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progressPct >= 100 ? 'bg-emerald-500' : progressPct >= 75 ? 'bg-brand-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-surface-300 mt-1">
            <span>{hoursToHM(s.totalWorkedHours)}</span>
            <span>{s.requiredTillToday}h target</span>
          </div>
        </div>
      )}

      {/* Daily Hours Chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold mb-4 text-surface-300 uppercase tracking-wider">Daily Hours</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-300" />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-300" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--tw-bg-opacity, rgba(255,255,255,0.95))',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: '13px'
                  }}
                  formatter={(val) => [`${val}h`, 'Hours']}
                />
                <ReferenceLine y={9} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '9h', position: 'right', fontSize: 11 }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.status === 'extra' ? '#10b981'
                        : entry.status === 'complete' ? '#3b82f6'
                        : entry.status === 'deficit' ? '#f59e0b'
                        : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color }) {
  const colorMap = {
    brand: 'text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-surface-300 uppercase tracking-wider">{label}</p>
      <p className="text-xl sm:text-2xl font-bold mt-0.5">{value}</p>
      <p className="text-xs text-surface-300 mt-0.5">{sub}</p>
    </div>
  );
}
