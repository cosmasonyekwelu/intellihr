import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  UserCheck, 
  MapPin, 
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const Attendance: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [todayLog, setTodayLog] = useState<any>(null);
  const [error, setError] = useState('');

  const userString = localStorage.getItem('intellihr_user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr_manager';

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = async () => {
    try {
      const today = new Date();
      const report = await api.attendance.getReport({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        employeeId: !isAdminOrHR ? user.employeeId : undefined
      });

      setRecords(report.logs || []);
      setStats(report.stats || { present: 0, late: 0, absent: 0, total: 0 });

      // Find if checked in today
      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      const todaysRecord = report.logs?.find((log: any) => {
        const logDate = new Date(log.date);
        logDate.setHours(0,0,0,0);
        return logDate.getTime() === startOfToday.getTime() && log.employeeId?._id === user.employeeId;
      });

      setTodayLog(todaysRecord || null);
    } catch (err) {
      console.error('Failed loading attendance logs:', err);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleAction = async () => {
    setLoading(true);
    setError('');

    try {
      if (!todayLog) {
        // Trigger Check-In
        await api.attendance.checkIn();
      } else {
        // Trigger Check-Out
        await api.attendance.checkOut();
      }
      await loadAttendance();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error occurred during check-in/out.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'present') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (status === 'late') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
      
      {/* Clocking Station Widget */}
      <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Check-In Station
          </h3>
          <p className="text-[10px] text-slate-500">Record your daily work attendance logs</p>
        </div>

        {/* Live Clock Display */}
        <div className="py-6 text-center space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-4">
          <button
            onClick={handleAction}
            disabled={loading || (todayLog && todayLog.checkOut)}
            id="btn_clock_in_out"
            className={`w-full py-4 rounded-xl text-xs font-bold text-white transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg ${
              !todayLog 
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10' 
                : todayLog.checkOut
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50 shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10'
            }`}
          >
            <UserCheck className="w-4.5 h-4.5" />
            {loading 
              ? 'Transmitting logs...' 
              : !todayLog 
                ? 'Check-In Today' 
                : todayLog.checkOut
                  ? 'Day Complete ✓'
                  : 'Check-Out Today'
            }
          </button>

          {/* Today Check-in status display */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Geolocation</span>
              <span className="font-bold text-slate-300">Office Headquarter</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Today's Log</span>
              <span className="font-bold text-slate-200">
                {todayLog 
                  ? `In: ${new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                  : 'No entry logs'
                }
              </span>
            </div>
            {todayLog?.checkOut && (
              <div className="flex justify-between items-center text-slate-400">
                <span>Check-Out Log</span>
                <span className="font-bold text-emerald-400">
                  Out: {new Date(todayLog.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Log Archives (Middle & Right panels) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Present</span>
            <h4 className="text-xl font-extrabold text-white">{stats.present}</h4>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Lateness</span>
            <h4 className="text-xl font-extrabold text-amber-400">{stats.late}</h4>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Absence</span>
            <h4 className="text-xl font-extrabold text-rose-400">{stats.absent}</h4>
          </div>
        </div>

        {/* Archives Table */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            Timesheet History ({new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })})
          </h3>

          {records.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No timesheet entries found for this month period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    {isAdminOrHR && <th className="pb-3 font-semibold">Employee</th>}
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">In Time</th>
                    <th className="pb-3 font-semibold">Out Time</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {records.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-950/20">
                      {isAdminOrHR && (
                        <td className="py-3 font-bold text-slate-200">
                          {log.employeeId?.name || 'Unknown'}
                        </td>
                      )}
                      <td className="py-3 font-medium text-slate-350">
                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {log.checkIn 
                          ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : 'N/A'
                        }
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {log.checkOut 
                          ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : 'N/A'
                        }
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
