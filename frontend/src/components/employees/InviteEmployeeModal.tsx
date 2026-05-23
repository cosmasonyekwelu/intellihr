import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';

const departments = ['Engineering', 'Sales', 'Marketing', 'Human Resources', 'Operations', 'Finance'];

interface InviteEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export const InviteEmployeeModal: React.FC<InviteEmployeeModalProps> = ({ open, onClose, onInvited }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: ''
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.employees.invite({
        name: form.name,
        email: form.email,
        phone: form.phone,
        position: form.position,
        department: form.department,
        salary: form.salary ? Number(form.salary) : undefined
      });
      toast({ type: 'success', title: 'Invitation sent', message: `${form.name} has been invited.` });
      if (response.inviteUrl) {
        console.info('Employee invitation link:', response.inviteUrl);
      }
      setForm({ name: '', email: '', phone: '', position: '', department: '', salary: '' });
      onInvited();
      onClose();
    } catch (err: any) {
      toast({ type: 'error', title: 'Invitation failed', message: err.response?.data?.message || 'Please review the invite details.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite employee"
      description="Create an invited employee record and send the registration link by email."
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Employee name" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          <Input label="Email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
          <Input label="Phone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} hint="Optional" />
          <Input label="Position" value={form.position} onChange={(event) => updateField('position', event.target.value)} required />
          <Select label="Department" value={form.department} onChange={(event) => updateField('department', event.target.value)} required>
            <option value="">Select department</option>
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </Select>
          <Input label="Monthly salary" type="number" value={form.salary} onChange={(event) => updateField('salary', event.target.value)} hint="Optional" />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Send invitation</Button>
        </div>
      </form>
    </Modal>
  );
};
