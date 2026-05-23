import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CalendarClock, 
  Wallet, 
  UserCheck,
  CheckCircle2,
  Sparkles,
  Bot
} from 'lucide-react';
import { StatCard } from '../components/Common/StatCard';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const userString = localStorage.getItem('intellihr_user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr_manager';

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    payrollSpending: 0,
  });

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (isAdminOrHR) {
          // HR/Admin: Fetch all employees to aggregate stats
          const empData = await api.employees.list({ limit: 100 });
          const total = empData.total || 0;
          const active = empData.employees?.filter((e: any) => e.status === 'active').length || 0;

          // Fetch pending leaves
          const leaveData = await api.leaves.list({ status: 'pending' });
          const pendingCount = leaveData.requests?.length || 0;
          setPendingRequests(leaveData.requests || []);

          // Fetch latest payroll records to calculate monthly spending
          const today = new Date();
          const payrollData = await api.payroll.list({ month: today.getMonth() + 1, year: today.getFullYear() });
          let monthlySpending = 0;
          payrollData.records?.forEach((rec: any) => {
            monthlySpending += rec.netSalary;
          });

          // Fallback if no payroll run yet: compute dynamic average spending
          if (monthlySpending === 0 && empData.employees) {
            empData.employees.forEach((e: any) => {
              monthlySpending += e.salary;
            });
          }

          setStats({
            totalEmployees: total,
            activeEmployees: active,
            pendingLeaves: pendingCount,
            payrollSpending: monthlySpending,
          });
        } else {
          // Employee: Fetch their own attendance report and active requests
          const leaveData = await api.leaves.list();
          const pendingCount = leaveData.requests?.filter((r: any) => r.status === 'pending').length || 0;
          
          // Get own details
          const empData = await api.employees.list({});
          const employeeSalary = empData.employees?.[0]?.salary || 0;

          setStats({
            totalEmployees: 1,
            activeEmployees: empData.employees?.[0]?.status === 'active' ? 1 : 0,
            pendingLeaves: pendingCount,
            payrollSpending: employeeSalary,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdminOrHR]);

  const handleApprove = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await api.leaves.approve(id, action);
      // Reload pending leaves
      const leaveData = await api.leaves.list({ status: 'pending' });
      setPendingRequests(leaveData.requests || []);
      setStats((prev) => ({ ...prev, pendingLeaves: leaveData.requests?.length || 0 }));
    } catch (error) {
      console.error('Failed to update leave status:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      
      {/* Greetings */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.name || 'User'}
            <Sparkles className="w-5 h-5 text-indigo-400 fill-indigo-400" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Here is what is happening across your company space today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-bold text-slate-400">
            System Local: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Numerical Analytics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={isAdminOrHR ? "Total Headcount" : "Your Account"}
          value={loading ? "..." : stats.totalEmployees}
          icon={Users}
          description={isAdminOrHR ? "Registered users" : "Linked profile record"}
          color="indigo"
        />
        <StatCard
          title="Active Status"
          value={loading ? "..." : stats.activeEmployees}
          icon={UserCheck}
          description="Employees active now"
          color="emerald"
        />
        <StatCard
          title="Pending Leaves"
          value={loading ? "..." : stats.pendingLeaves}
          icon={CalendarClock}
          description="Awaiting HR actions"
          color="amber"
        />
        <StatCard
          title={isAdminOrHR ? "Monthly Outlay" : "Monthly Takehome"}
          value={loading ? "..." : `$${stats.payrollSpending.toLocaleString()}`}
          icon={Wallet}
          description={isAdminOrHR ? "Total company payroll" : "Gross base contract pay"}
          color="rose"
        />
      </div>

      {/* Main Content Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending approvals table (Visible to HR Managers only) */}
        {isAdminOrHR ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-400" />
                Awaiting Leave Approvals
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                {pendingRequests.length} Pending
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading pending queues...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-slate-300">All caught up!</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">No leave requests are waiting approval.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Employee</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Date Range</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {pendingRequests.slice(0, 5).map((req) => (
                      <tr key={req._id} className="hover:bg-slate-950/20 group">
                        <td className="py-3.5">
                          <div className="font-bold text-slate-200">{req.employeeId?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{req.employeeId?.position}</div>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[9px] uppercase">
                            {req.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-400 font-medium">
                          {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleApprove(req._id, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white font-bold transition-all text-[10px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprove(req._id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold transition-all text-[10px]"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Employee Dashboard Guide */
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Bot className="w-4.5 h-4.5 text-indigo-400" />
              Your HR Helper Hub
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use the floating AI Assistant on the bottom right to clock check-in/out logs, request leaves, or analyze details about your pay calculations. 
              The AI possesses real-time access to your profile parameters.
            </p>
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-300">
              <span className="font-semibold text-indigo-400 block mb-1">💡 Sandbox Query Tips:</span>
              Try querying: <code className="text-indigo-300 bg-indigo-950/30 px-1 py-0.5 rounded font-mono font-bold">"Summarize my attendance logs"</code> or <code className="text-indigo-300 bg-indigo-950/30 px-1 py-0.5 rounded font-mono font-bold">"Explain my payroll gross calculations."</code>
            </div>
          </div>
        )}

        {/* Side AI Integration Widget Panel */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            Active Integrations
          </h3>
          <div className="space-y-3.5">
            
            {/* OpenAI SDK status */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">OpenAI API Engine</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">GPT-4o-mini Orchestrator</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Twilio SMS status */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Twilio WhatsApp Sandbox</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Alert Dispatch Service</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Slack Webhook status */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Slack Incoming Channel</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Webhook n8n Alerts</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
