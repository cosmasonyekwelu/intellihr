import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Table, TableShell, Td, Th } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';

export const LeaveTypes: React.FC = () => {
  const { toast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', allowedDays: '20', carryOver: false, requiresApproval: true });

  const loadLeaveTypes = async () => {
    try {
      const data = await api.leaveTypes.list();
      setLeaveTypes(data.leaveTypes || []);
    } catch {
      toast({ type: 'error', title: 'Could not load leave types' });
    }
  };

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.leaveTypes.create({
        name: form.name,
        allowedDays: Number(form.allowedDays),
        carryOver: form.carryOver,
        requiresApproval: form.requiresApproval
      });
      toast({ type: 'success', title: 'Leave type created' });
      setForm({ name: '', allowedDays: '20', carryOver: false, requiresApproval: true });
      loadLeaveTypes();
    } catch (err: any) {
      toast({ type: 'error', title: 'Could not save leave type', message: err.response?.data?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this leave type?')) return;
    try {
      await api.leaveTypes.delete(id);
      toast({ type: 'success', title: 'Leave type deleted' });
      loadLeaveTypes();
    } catch {
      toast({ type: 'error', title: 'Delete failed' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Leave types</h1>
        <p className="mt-1 text-sm text-slate-500">Define company leave policies and annual day limits.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Create leave type</CardTitle>
            <CardDescription>Use -1 allowed days for unlimited leave.</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_160px_auto_auto_auto] md:items-end">
          <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Annual Leave" required />
          <Input label="Allowed days" type="number" value={form.allowedDays} onChange={(event) => setForm({ ...form, allowedDays: event.target.value })} required />
          <label className="flex h-10 items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.carryOver} onChange={(event) => setForm({ ...form, carryOver: event.target.checked })} className="accent-indigo-600" />
            Carry over
          </label>
          <label className="flex h-10 items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.requiresApproval} onChange={(event) => setForm({ ...form, requiresApproval: event.target.checked })} className="accent-indigo-600" />
            Approval
          </label>
          <Button type="submit" loading={loading}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </Card>

      <Card padded={false}>
        <TableShell className="border-0">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Allowed days</Th>
                <Th>Carry over</Th>
                <Th>Approval</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaveTypes.map((leaveType) => (
                <tr key={leaveType._id}>
                  <Td className="font-semibold text-slate-950">{leaveType.name}</Td>
                  <Td>{leaveType.allowedDays === -1 ? 'Unlimited' : leaveType.allowedDays}</Td>
                  <Td>{leaveType.carryOver ? 'Yes' : 'No'}</Td>
                  <Td>{leaveType.requiresApproval ? 'Required' : 'Automatic'}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(leaveType._id)} aria-label={`Delete ${leaveType.name}`}>
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      </Card>
    </div>
  );
};
