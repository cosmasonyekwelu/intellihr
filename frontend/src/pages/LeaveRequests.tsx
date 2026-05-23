import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, 
  Send, 
  CheckSquare, 
  HelpCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const LeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submission Form
  const [formData, setFormData] = useState({
    type: 'annual' as 'sick' | 'annual' | 'unpaid',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userString = localStorage.getItem('intellihr_user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr_manager';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.leaves.list();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed fetching leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setSubmitError('All fields are required to submit leave requests.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await api.leaves.submit(formData);
      setFormData({
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: ''
      });
      fetchRequests();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error submitting leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await api.leaves.approve(id, action);
      fetchRequests();
    } catch (err) {
      console.error('Failed to update leave request status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (status === 'rejected') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300">
      
      {/* Submit Leave request form */}
      <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 h-fit">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" />
            Apply for Leave
          </h3>
          <p className="text-[10px] text-slate-500">Request formal sick, annual, or unpaid absences</p>
        </div>

        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Leave Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-350 focus:border-indigo-500 focus:outline-none"
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              id="input_leave_start_date"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              id="input_leave_end_date"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reason for absence</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide a detailed reason..."
              id="textarea_leave_reason"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            id="btn_apply_leave"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 transition-all"
          >
            {submitting ? 'Submitting request...' : 'Transmit Request'}
          </button>

        </form>
      </div>

      {/* Leave Request Queue */}
      <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <CalendarDays className="w-4.5 h-4.5 text-indigo-400" />
          {isAdminOrHR ? 'Leave Approvals Queue' : 'Your Absence Applications'}
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading queues...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
            <HelpCircle className="w-7 h-7 text-slate-600 mx-auto" />
            <p>No leave requests found in this scope.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  {isAdminOrHR && <th className="pb-3 font-semibold">Employee</th>}
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Absence Period</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                  {isAdminOrHR && <th className="pb-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-950/20 group">
                    {isAdminOrHR && (
                      <td className="py-4 font-bold text-slate-200">
                        {req.employeeId?.name || 'Unknown'}
                        <span className="text-[10px] text-slate-500 font-semibold block">{req.employeeId?.position}</span>
                      </td>
                    )}
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-850 text-indigo-400 font-mono font-bold text-[9px] uppercase border border-slate-800">
                        {req.type}
                      </span>
                    </td>
                    <td className="py-4 text-slate-350 font-medium whitespace-nowrap">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-slate-400 font-medium max-w-xs truncate">
                      {req.reason}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    {isAdminOrHR && (
                      <td className="py-4 text-right whitespace-nowrap space-x-2">
                        {req.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(req._id, 'approved')}
                              className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors text-[9px]"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(req._id, 'rejected')}
                              className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold transition-colors text-[9px]"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
