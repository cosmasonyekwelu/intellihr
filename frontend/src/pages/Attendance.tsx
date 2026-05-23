import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableShell, Td, Th } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { getCurrentUser } from '../services/auth';

const statusTone: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700',
  late: 'bg-amber-50 text-amber-700',
  absent: 'bg-rose-50 text-rose-700'
};

export const Attendance: React.FC = () => {
  const { toast } = useToast();
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [todayLog, setTodayLog] = useState<any>(null);
  const user = getCurrentUser();
  const isHR = user?.role === 'hr';

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadAttendance = async () => {
    try {
      const today = new Date();
      const report = await api.attendance.getReport({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        employeeId: !isHR ? user?.employeeId : undefined
      });

      setRecords(report.logs || []);
      setStats(report.stats || { present: 0, late: 0, absent: 0, total: 0 });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todaysRecord = report.logs?.find((log: any) => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === startOfToday.getTime() && (!user?.employeeId || log.employeeId?._id === user.employeeId);
      });

      setTodayLog(todaysRecord || null);
    } catch {
      toast({ type: 'error', title: 'Attendance unavailable' });
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleAction = async () => {
    setLoading(true);

    try {
      if (!todayLog) {
        await api.attendance.checkIn();
        toast({ type: 'success', title: 'Checked in', message: 'Your attendance has been recorded.' });
      } else {
        await api.attendance.checkOut();
        toast({ type: 'success', title: 'Checked out', message: 'Your workday is complete.' });
      }

      await loadAttendance();
    } catch (err: any) {
      toast({ type: 'error', title: 'Clock action failed', message: err.response?.data?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const heatmapDays = useMemo(() => {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const match = records.find((record) => new Date(record.date).getDate() === day);
      return { day, status: match?.status || 'none' };
    });
  }, [records]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="h-fit">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-indigo-600" /> Check-in station</CardTitle>
            <CardDescription>Record daily attendance with one action.</CardDescription>
          </div>
        </CardHeader>

        <div className="rounded-lg bg-slate-950 p-6 text-center text-white">
          <p className="font-mono text-4xl font-bold tracking-tight">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          <p className="mt-2 text-sm text-slate-300">{time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        <Button
          id="btn_clock_in_out"
          className="mt-5 w-full"
          size="lg"
          onClick={handleAction}
          loading={loading}
          disabled={Boolean(todayLog?.checkOut)}
        >
          <UserCheck className="h-4 w-4" />
          {!todayLog ? 'Check in today' : todayLog.checkOut ? 'Day complete' : 'Check out today'}
        </Button>

        <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</span>
            <span className="font-semibold text-slate-950">Office HQ</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Today</span>
            <span className="font-semibold text-slate-950">
              {todayLog ? `In: ${new Date(todayLog.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No log yet'}
            </span>
          </div>
          {todayLog?.checkOut && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Check out</span>
              <span className="font-semibold text-emerald-700">{new Date(todayLog.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-6 xl:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card><p className="text-sm text-slate-500">Present</p><p className="mt-2 text-3xl font-bold text-emerald-700">{stats.present}</p></Card>
          <Card><p className="text-sm text-slate-500">Late</p><p className="mt-2 text-3xl font-bold text-amber-700">{stats.late}</p></Card>
          <Card><p className="text-sm text-slate-500">Absent</p><p className="mt-2 text-3xl font-bold text-rose-700">{stats.absent}</p></Card>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-600" /> Monthly heatmap</CardTitle>
              <CardDescription>Quick status view for the current month.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid grid-cols-7 gap-2">
            {heatmapDays.map((day) => (
              <div
                key={day.day}
                title={`Day ${day.day}: ${day.status}`}
                className={`flex aspect-square items-center justify-center rounded-lg text-xs font-semibold ${
                  day.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                    day.status === 'late' ? 'bg-amber-100 text-amber-800' :
                      day.status === 'absent' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-400'
                }`}
              >
                {day.day}
              </div>
            ))}
          </div>
        </Card>

        <Card padded={false}>
          <CardHeader className="mb-0 border-b border-slate-200 p-5">
            <div>
              <CardTitle>Timesheet history</CardTitle>
              <CardDescription>{new Date().toLocaleString(undefined, { month: 'long', year: 'numeric' })}</CardDescription>
            </div>
          </CardHeader>
          {records.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No timesheet entries found for this month.</div>
          ) : (
            <TableShell className="border-0">
              <Table>
                <thead>
                  <tr>
                    {isHR && <Th>Employee</Th>}
                    <Th>Date</Th>
                    <Th>In</Th>
                    <Th>Out</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((log) => (
                    <tr key={log._id}>
                      {isHR && <Td className="font-semibold text-slate-950">{log.employeeId?.name || 'Unknown'}</Td>}
                      <Td>{new Date(log.date).toLocaleDateString()}</Td>
                      <Td>{log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Td>
                      <Td>{log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</Td>
                      <Td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone[log.status] || 'bg-slate-100 text-slate-600'}`}>{log.status}</span></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          )}
        </Card>
      </div>
    </div>
  );
};
