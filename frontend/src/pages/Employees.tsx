import React, { useEffect, useState } from 'react';
import { Edit3, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { Table, TableShell, Td, Th } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { InviteEmployeeModal } from '../components/employees/InviteEmployeeModal';
import { api } from '../services/api';

const departments = ['Engineering', 'Sales', 'Marketing', 'Human Resources', 'Operations', 'Finance'];
const emptyForm = {
  name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  salary: 3000,
  status: 'active',
  performanceRating: 3,
  photo: null as File | null
};

export const Employees: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionEmployee, setActionEmployee] = useState<any>(null);
  const [actionForm, setActionForm] = useState({
    action: 'promote',
    value: '',
    startDate: '',
    endDate: '',
    paid: false,
    reason: ''
  });
  const [selectedId, setSelectedId] = useState('');
  const [formData, setFormData] = useState(emptyForm);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.employees.list({ search, department, status, limit: 100 });
      setEmployees(data.employees || []);
    } catch {
      toast({ type: 'error', title: 'Could not load employees' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department, status]);

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedId('');
  };

  const handleEdit = (employee: any) => {
    setSelectedId(employee._id);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      salary: employee.salary,
      status: employee.status,
      performanceRating: employee.performanceRating || 3,
      photo: null
    });
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) data.append(key, value instanceof File ? value : String(value));
      });

      await api.employees.update(selectedId, data);
      toast({ type: 'success', title: 'Employee updated' });

      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      toast({ type: 'error', title: 'Employee save failed', message: err.response?.data?.message || 'Please review the form.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this employee record?')) return;

    try {
      await api.employees.delete(id);
      toast({ type: 'success', title: 'Employee removed' });
      fetchEmployees();
    } catch {
      toast({ type: 'error', title: 'Delete failed' });
    }
  };

  const openAction = (employee: any) => {
    setActionEmployee(employee);
    setActionForm({ action: 'promote', value: '', startDate: '', endDate: '', paid: false, reason: '' });
    setActionOpen(true);
  };

  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!actionEmployee) return;

    try {
      if (actionForm.action === 'promote') {
        await api.employees.promote(actionEmployee._id, { toPosition: actionForm.value, reason: actionForm.reason });
      } else if (actionForm.action === 'transfer') {
        await api.employees.transfer(actionEmployee._id, { toDept: actionForm.value, reason: actionForm.reason });
      } else if (actionForm.action === 'warning') {
        await api.employees.warn(actionEmployee._id, { type: actionForm.value as any, reason: actionForm.reason });
      } else if (actionForm.action === 'suspend') {
        await api.employees.suspend(actionEmployee._id, {
          startDate: actionForm.startDate,
          endDate: actionForm.endDate,
          reason: actionForm.reason,
          paid: actionForm.paid
        });
      } else if (actionForm.action === 'terminate') {
        await api.employees.terminate(actionEmployee._id, { type: actionForm.value as any, reason: actionForm.reason });
      }
      toast({ type: 'success', title: 'Employee action recorded' });
      setActionOpen(false);
      fetchEmployees();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action failed', message: err.response?.data?.message || 'Please review the action details.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Employee directory</h1>
          <p className="mt-1 text-sm text-slate-500">Invite employees, monitor registration status, and manage workforce records.</p>
        </div>
        <Button id="btn_invite_employee" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite employee
        </Button>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
          <Input
            id="input_search_employee"
            icon={Search}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, role, or email"
            aria-label="Search employees"
          />
          <Select id="filter_department" value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department">
            <option value="">All departments</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select id="filter_status" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="invited">Invited</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="mb-0 border-b border-slate-200 p-5">
          <div>
            <CardTitle>People</CardTitle>
            <CardDescription>{employees.length} records in this view</CardDescription>
          </div>
        </CardHeader>

        {loading ? (
          <SkeletonLoader rows={5} className="p-5" />
        ) : employees.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-950">No employees found</p>
            <p className="mt-1 text-sm text-slate-500">Adjust the filters or invite your first team member.</p>
          </div>
        ) : (
          <TableShell className="border-0">
            <Table>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Salary</Th>
                  <Th>Performance</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => (
                  <tr key={employee._id} className="transition hover:bg-slate-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={employee.name} src={employee.photoUrl} />
                        <div>
                          <p className="font-semibold text-slate-950">{employee.name}</p>
                          <p className="text-xs text-slate-500">{employee.position} • {employee.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>{employee.department}</Td>
                    <Td className="font-semibold text-slate-950">${employee.salary.toLocaleString()}</Td>
                    <Td>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {employee.performanceRating || 3}/5
                      </span>
                    </Td>
                    <Td>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        employee.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                          employee.status === 'invited' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                      }`}>
                        {employee.status.replace('_', ' ')}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)} aria-label={`Edit ${employee.name}`}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openAction(employee)}>
                          Actions
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(employee._id)} aria-label={`Delete ${employee.name}`}>
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableShell>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-0">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Edit employee</h2>
                <p className="text-sm text-slate-500">Keep profile and compensation details current.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
                <Input label="Email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
                <Input label="Phone" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} />
                <Input label="Job title" value={formData.position} onChange={(event) => setFormData({ ...formData, position: event.target.value })} required />
                <Select label="Department" value={formData.department} onChange={(event) => setFormData({ ...formData, department: event.target.value })} required>
                  <option value="">Select department</option>
                  {departments.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Input label="Monthly salary" type="number" value={formData.salary} onChange={(event) => setFormData({ ...formData, salary: Number(event.target.value) })} required />
                <Select label="Status" value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} required>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="inactive">Inactive</option>
                </Select>
                <Input label="Photo" type="file" accept="image/*" onChange={(event) => setFormData({ ...formData, photo: event.target.files?.[0] || null })} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Performance rating</span>
                  <span className="font-semibold text-indigo-600">{formData.performanceRating}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.performanceRating}
                  onChange={(event) => setFormData({ ...formData, performanceRating: Number(event.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button id="btn_submit_employee_modal" type="submit">Save changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      <InviteEmployeeModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={fetchEmployees} />
      <Modal open={actionOpen} onClose={() => setActionOpen(false)} title="Employee action" description={actionEmployee ? `Record an HR action for ${actionEmployee.name}.` : undefined}>
        <form onSubmit={submitAction} className="space-y-4 p-5">
          <Select label="Action" value={actionForm.action} onChange={(event) => setActionForm({ ...actionForm, action: event.target.value, value: '' })}>
            <option value="promote">Promotion</option>
            <option value="transfer">Transfer</option>
            <option value="warning">Warning</option>
            <option value="suspend">Suspension</option>
            <option value="terminate">Termination</option>
          </Select>

          {['promote', 'transfer', 'warning', 'terminate'].includes(actionForm.action) && (
            <Select label={actionForm.action === 'warning' ? 'Warning type' : actionForm.action === 'terminate' ? 'Termination type' : actionForm.action === 'transfer' ? 'New department' : 'New position'} value={actionForm.value} onChange={(event) => setActionForm({ ...actionForm, value: event.target.value })} required>
              <option value="">Select value</option>
              {actionForm.action === 'warning' && (
                <>
                  <option value="verbal">Verbal</option>
                  <option value="written">Written</option>
                  <option value="final">Final</option>
                </>
              )}
              {actionForm.action === 'terminate' && (
                <>
                  <option value="layoff">Layoff</option>
                  <option value="fired">Fired</option>
                </>
              )}
              {actionForm.action === 'transfer' && departments.map((department) => <option key={department} value={department}>{department}</option>)}
              {actionForm.action === 'promote' && ['Senior Associate', 'Team Lead', 'Manager', 'Director'].map((position) => <option key={position} value={position}>{position}</option>)}
            </Select>
          )}

          {actionForm.action === 'suspend' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Start date" type="date" value={actionForm.startDate} onChange={(event) => setActionForm({ ...actionForm, startDate: event.target.value })} required />
              <Input label="End date" type="date" value={actionForm.endDate} onChange={(event) => setActionForm({ ...actionForm, endDate: event.target.value })} required />
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={actionForm.paid} onChange={(event) => setActionForm({ ...actionForm, paid: event.target.checked })} className="accent-indigo-600" />
                Paid suspension
              </label>
            </div>
          )}

          <Textarea label="Reason" value={actionForm.reason} onChange={(event) => setActionForm({ ...actionForm, reason: event.target.value })} required />
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Button type="button" variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button type="submit">Record action</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
