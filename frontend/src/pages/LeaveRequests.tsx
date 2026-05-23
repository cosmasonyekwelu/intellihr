import React, { useEffect, useState } from 'react';
import { CalendarDays, HelpCircle, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Select, Textarea, Input } from '../components/ui/Input';
import { Table, TableShell, Td, Th } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { getCurrentUser } from '../services/auth';

const statusTone: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-700'
};

export const LeaveRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const user = getCurrentUser();
  const isHR = user?.role === 'hr';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.leaves.list();
      setRequests(data.requests || []);
      const types = await api.leaveTypes.list();
      setLeaveTypes(types.leaveTypes || []);
      if (!formData.leaveTypeId && types.leaveTypes?.[0]?._id) {
        setFormData((current) => ({ ...current, leaveTypeId: types.leaveTypes[0]._id }));
      }
    } catch {
      toast({ type: 'error', title: 'Could not load leave requests' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApply = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast({ type: 'error', title: 'Complete the leave form', message: 'Leave type, dates, and reason are required.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.leaves.submit(formData);
      toast({ type: 'success', title: 'Leave request submitted' });
      setFormData({ leaveTypeId: leaveTypes[0]?._id || '', startDate: '', endDate: '', reason: '' });
      fetchRequests();
    } catch (err: any) {
      toast({ type: 'error', title: 'Submission failed', message: err.response?.data?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, action: 'approved' | 'rejected') => {
    try {
      if (action === 'approved') await api.leaves.approve(id, action);
      else await api.leaves.reject(id);
      toast({ type: 'success', title: `Request ${action}` });
      fetchRequests();
    } catch {
      toast({ type: 'error', title: 'Could not update request' });
    }
  };

  const groupedRequests = {
    pending: requests.filter((request) => request.status === 'pending'),
    approved: requests.filter((request) => request.status === 'approved'),
    rejected: requests.filter((request) => request.status === 'rejected')
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {!isHR && <Card className="h-fit">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2"><Send className="h-4 w-4 text-indigo-600" /> Apply for leave</CardTitle>
            <CardDescription>Submit annual, sick, or unpaid leave requests.</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleApply} className="space-y-4">
          <Select label="Leave type" value={formData.leaveTypeId} onChange={(event) => setFormData({ ...formData, leaveTypeId: event.target.value })}>
            <option value="">Select leave type</option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType._id} value={leaveType._id}>
                {leaveType.name} ({leaveType.allowedDays === -1 ? 'Unlimited' : `${leaveType.allowedDays} days`})
              </option>
            ))}
          </Select>
          <Input label="Start date" type="date" id="input_leave_start_date" value={formData.startDate} onChange={(event) => setFormData({ ...formData, startDate: event.target.value })} required />
          <Input label="End date" type="date" id="input_leave_end_date" value={formData.endDate} onChange={(event) => setFormData({ ...formData, endDate: event.target.value })} required />
          <Textarea label="Reason" id="textarea_leave_reason" value={formData.reason} onChange={(event) => setFormData({ ...formData, reason: event.target.value })} placeholder="Add context for your manager..." required />
          <Button id="btn_apply_leave" type="submit" className="w-full" loading={submitting}>Submit request</Button>
        </form>
      </Card>}

      <div className={`space-y-6 ${isHR ? 'xl:col-span-3' : 'xl:col-span-2'}`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(groupedRequests).map(([status, items]) => (
            <Card key={status}>
              <p className="text-sm font-medium capitalize text-slate-500">{status}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{items.length}</p>
            </Card>
          ))}
        </div>

        <Card padded={false}>
          <CardHeader className="mb-0 border-b border-slate-200 p-5">
            <div>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-600" /> {isHR ? 'Leave approvals' : 'Your leave applications'}</CardTitle>
              <CardDescription>Track request status and manager decisions.</CardDescription>
            </div>
          </CardHeader>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-950">No leave requests</p>
              <p className="mt-1 text-sm text-slate-500">Submitted requests will appear here.</p>
            </div>
          ) : (
            <TableShell className="border-0">
              <Table>
                <thead>
                  <tr>
                    {isHR && <Th>Employee</Th>}
                    <Th>Type</Th>
                    <Th>Period</Th>
                    <Th>Reason</Th>
                    <Th>Status</Th>
                    {isHR && <Th className="text-right">Actions</Th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((request) => (
                    <tr key={request._id} className="transition hover:bg-slate-50">
                      {isHR && (
                        <Td>
                          <p className="font-semibold text-slate-950">{request.employeeId?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{request.employeeId?.position}</p>
                        </Td>
                      )}
                      <Td className="capitalize">{request.leaveTypeId?.name || 'Leave'}</Td>
                      <Td className="whitespace-nowrap">{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</Td>
                      <Td className="max-w-xs truncate">{request.reason}</Td>
                      <Td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusTone[request.status]}`}>{request.status}</span></Td>
                      {isHR && (
                        <Td className="text-right">
                          {request.status === 'pending' ? (
                            <div className="inline-flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleApprove(request._id, 'approved')}>Approve</Button>
                              <Button size="sm" variant="danger" onClick={() => handleApprove(request._id, 'rejected')}>Reject</Button>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Resolved</span>
                          )}
                        </Td>
                      )}
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
