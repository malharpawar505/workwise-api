import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { formatTime, formatDate, getDayName, hoursToHM, statusColor, MONTHS, isWeekend } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, Download, Pencil, X, Save, Filter
} from 'lucide-react';

export default function Records() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editRecord, setEditRecord] = useState(null);
  const [filterMode, setFilterMode] = useState('month'); // 'month' | 'range'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/monthly?year=${year}&month=${month}`);
      setRecords(data.records);
      setSummary(data.summary);
    } catch (err) {
      toast.error('Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  const fetchRange = async () => {
    if (!dateFrom || !dateTo) return toast.error('Select both dates.');
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/range?from=${dateFrom}&to=${dateTo}`);
      setRecords(data.records);
      setSummary(null);
    } catch {
      toast.error('Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterMode === 'month') fetchMonthly();
  }, [fetchMonthly, filterMode]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const exportExcel = async () => {
    try {
      const res = await api.get(`/attendance/export?year=${year}&month=${month}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${MONTHS[month - 1]}_${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch {
      toast.error('Export failed.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editRecord) return;
    try {
      await api.put(`/attendance/${editRecord.id}`, {
        login_time: editRecord.login_time,
        logout_time: editRecord.logout_time
      });
      toast.success('Record updated.');
      setEditRecord(null);
      fetchMonthly();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.');
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Records</h1>

        {/* Filter toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'month'
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterMode('range')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'range'
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-300'
            }`}
          >
            Date Range
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      {filterMode === 'month' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
            <span className="text-lg font-bold min-w-[160px] text-center">{MONTHS[month - 1]} {year}</span>
            <button onClick={nextMonth} className="btn-secondary p-2"><ChevronRight size={18} /></button>
          </div>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      ) : (
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-surface-300 mb-1">From</label>
              <input type="date" className="input-field text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-surface-300 mb-1">To</label>
              <input type="date" className="input-field text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button onClick={fetchRange} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
              <Filter size={16} /> Apply
            </button>
          </div>
        </div>
      )}

      {/* Summary row */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <MiniStat label="Worked" value={hoursToHM(summary.totalWorkedHours)} />
          <MiniStat label="Required" value={`${summary.requiredTillToday}h`} />
          <MiniStat label="Remaining" value={hoursToHM(summary.remaining)} />
          <MiniStat label="Extra" value={hoursToHM(summary.extra)} />
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-surface-300">
            <p className="text-lg font-medium">No records found</p>
            <p className="text-sm mt-1">Try a different month or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900">
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300 hidden sm:table-cell">Day</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300">In</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300">Out</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300">Hours</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300 hidden sm:table-cell">Diff</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-xs uppercase tracking-wider text-surface-300 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const diff = (r.total_hours || 0) - 9;
                  return (
                    <tr key={r.id} className="border-b border-surface-100 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{formatDate(r.date)}</td>
                      <td className="py-3 px-4 text-surface-300 hidden sm:table-cell">{getDayName(r.date)}</td>
                      <td className="py-3 px-4 font-mono text-xs">{formatTime(r.login_time)}</td>
                      <td className="py-3 px-4 font-mono text-xs">{formatTime(r.logout_time)}</td>
                      <td className="py-3 px-4 font-semibold">{r.total_hours ? `${r.total_hours}h` : '—'}</td>
                      <td className={`py-3 px-4 font-mono text-xs hidden sm:table-cell ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {r.total_hours ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}h` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`status-badge ${statusColor(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setEditRecord({ ...r })}
                          className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-300 hover:text-brand-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditRecord(null)}>
          <div className="card p-6 w-full max-w-md animate-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Record</h3>
              <button onClick={() => setEditRecord(null)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-surface-300 mb-4">{formatDate(editRecord.date)}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1">Login Time</label>
                <input
                  type="datetime-local"
                  className="input-field text-sm"
                  value={editRecord.login_time ? editRecord.login_time.slice(0, 16) : ''}
                  onChange={e => setEditRecord({ ...editRecord, login_time: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-300 mb-1">Logout Time</label>
                <input
                  type="datetime-local"
                  className="input-field text-sm"
                  value={editRecord.logout_time ? editRecord.logout_time.slice(0, 16) : ''}
                  onChange={e => setEditRecord({ ...editRecord, logout_time: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </div>
              <button onClick={handleSaveEdit} className="btn-primary w-full flex items-center justify-center gap-2">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-surface-300 font-medium">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
