import React, { useEffect, useState } from 'react';
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  UserCheck,
  Users,
  Wallet
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { StatCard } from '../components/Common/StatCard';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableShell, Td, Th } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { getCurrentUser } from '../services/auth';

const payrollTrend = [
  { month: 'Jan', payroll: 31800 },
  { month: 'Feb', payroll: 34200 },
  { month: 'Mar', payroll: 33750 },
  { month: 'Apr', payroll: 36100 },
  { month: 'May', payroll: 38300 },
  { month: 'Jun', payroll: 39800 }
];

const leaveMix = [
  { type: 'Annual', count: 12 },
  { type: 'Sick', count: 5 },
  { type: 'Unpaid', count: 3 }
];

export const Dashboard: React.FC = () => {
  const user = getCurrentUser();
  const isHR = user?.role === 'hr';
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    payrollSpending: 0
  });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isHR) {
        const empData = await api.employees.list({ limit: 100 });
        const leaveData = await api.leaves.list({ status: 'pending' });
        const today = new Date();
        const payrollData = await api.payroll.list({ month: today.getMonth() + 1, year: today.getFullYear() });

        const monthlySpending = payrollData.records?.reduce((sum: number, rec: any) => sum + rec.netSalary, 0) ||
          empData.employees?.reduce((sum: number, employee: any) => sum + employee.salary, 0) ||
          0;

        setPendingRequests(leaveData.requests || []);
        setStats({
          totalEmployees: empData.total || 0,
          activeEmployees: empData.employees?.filter((employee: any) => employee.status === 'active').length || 0,
          pendingLeaves: leaveData.requests?.length || 0,
          payrollSpending: monthlySpending
        });
      } else {
        const leaveData = await api.leaves.list();
        const empData = await api.employees.list({});
        setStats({
          totalEmployees: 1,
          activeEmployees: empData.employees?.[0]?.status === 'active' ? 1 : 0,
          pendingLeaves: leaveData.requests?.filter((request: any) => request.status === 'pending').length || 0,
          payrollSpending: empData.employees?.[0]?.salary || 0
        });
      }
    } catch {
      toast({ type: 'error', title: 'Dashboard data unavailable', message: 'Please check the API connection.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isHR]);

  const handleApprove = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await api.leaves.approve(id, action);
      toast({ type: 'success', title: `Leave ${action}`, message: 'The request queue has been updated.' });
      fetchDashboardData();
    } catch {
      toast({ type: 'error', title: 'Could not update leave request' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Today</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Welcome back, {user?.name || 'User'}</h1>
          <p className="mt-1 text-sm text-slate-500">A current view of people operations across your workspace.</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title={isHR ? 'Total employees' : 'Your profile'} value={loading ? '-' : stats.totalEmployees} icon={Users} description={isHR ? 'Registered workforce' : 'Linked employee record'} color="indigo" />
        <StatCard title="Active status" value={loading ? '-' : stats.activeEmployees} icon={UserCheck} description="Currently active" color="emerald" />
        <StatCard title="Pending leaves" value={loading ? '-' : stats.pendingLeaves} icon={CalendarClock} description="Awaiting action" color="amber" />
        <StatCard title={isHR ? 'Payroll this month' : 'Monthly pay'} value={loading ? '-' : `$${stats.payrollSpending.toLocaleString()}`} icon={Wallet} description="Net forecast" color="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Payroll trend</CardTitle>
              <CardDescription>Monthly payroll movement for finance review.</CardDescription>
            </div>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Payroll']} />
                <Area type="monotone" dataKey="payroll" stroke="#4f46e5" fill="#c7d2fe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Leave by type</CardTitle>
              <CardDescription>Requests grouped by category.</CardDescription>
            </div>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveMix}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{isHR ? 'Awaiting leave approvals' : 'Your HR hub'}</CardTitle>
              <CardDescription>{isHR ? 'Review the latest pending requests.' : 'Your personal activity and assistant entry point.'}</CardDescription>
            </div>
          </CardHeader>

          {isHR ? (
            pendingRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
                <p className="mt-3 font-semibold text-slate-950">All caught up</p>
                <p className="mt-1 text-sm text-slate-500">No leave requests are waiting approval.</p>
              </div>
            ) : (
              <TableShell>
                <Table>
                  <thead>
                    <tr>
                      <Th>Employee</Th>
                      <Th>Type</Th>
                      <Th>Date range</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingRequests.slice(0, 5).map((request) => (
                      <tr key={request._id}>
                        <Td>
                          <p className="font-semibold text-slate-950">{request.employeeId?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{request.employeeId?.position}</p>
                        </Td>
                        <Td className="capitalize">{request.type}</Td>
                        <Td>{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</Td>
                        <Td className="text-right">
                          <div className="inline-flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleApprove(request._id, 'approved')}>Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => handleApprove(request._id, 'rejected')}>Reject</Button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableShell>
            )
          ) : (
            <div className="rounded-lg bg-indigo-50 p-5 text-sm leading-6 text-indigo-950">
              Use the IntelliHR Copilot to summarize attendance, explain payroll calculations, or prepare leave request context for HR.
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-indigo-600" /> Active integrations</CardTitle>
              <CardDescription>Workflow services connected to HR operations.</CardDescription>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {['OpenAI assistant', 'n8n workflow engine', 'Slack and email alerts'].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-semibold text-slate-700">{item}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
