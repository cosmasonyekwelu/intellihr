import React, { useEffect, useState } from 'react';
import { Building2, KeyRound, UserRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, Select, Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { getCurrentUser } from '../services/auth';

export const Profile: React.FC = () => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const isHR = currentUser?.role === 'hr';
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', companyName: '', timezone: 'Africa/Lagos', currency: 'NGN' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [resignation, setResignation] = useState({ reason: '', lastWorkingDay: '' });
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    const data = await api.profile.get();
    setProfile(data);
    setForm({
      name: data.user?.name || '',
      phone: data.user?.phone || data.user?.employeeId?.phone || '',
      address: data.user?.employeeId?.address || '',
      companyName: data.company?.name || '',
      timezone: data.company?.settings?.timezone || 'Africa/Lagos',
      currency: data.company?.settings?.currency || 'NGN'
    });
  };

  useEffect(() => {
    loadProfile().catch(() => toast({ type: 'error', title: 'Could not load profile' }));
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.profile.update(form);
      toast({ type: 'success', title: 'Profile updated' });
      loadProfile();
    } catch {
      toast({ type: 'error', title: 'Profile update failed' });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.profile.changePassword(passwords);
      toast({ type: 'success', title: 'Password changed' });
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Password change failed', message: err.response?.data?.message });
    }
  };

  const submitResignation = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.employees.resign(resignation);
      toast({ type: 'success', title: 'Resignation submitted', message: 'HR will review your request.' });
      setResignation({ reason: '', lastWorkingDay: '' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Submission failed', message: err.response?.data?.message });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2"><UserRound className="h-4 w-4 text-indigo-600" /> Profile</CardTitle>
            <CardDescription>Manage your personal and company details.</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            {!isHR && <Input label="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="sm:col-span-2" />}
          </div>

          {isHR && (
            <div className="border-t border-slate-200 pt-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950"><Building2 className="h-4 w-4 text-indigo-600" /> Company settings</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Company name" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
                <Input label="Timezone" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
                <Select label="Currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="EUR">EUR</option>
                </Select>
              </div>
            </div>
          )}

          <Button type="submit" loading={loading}>Save profile</Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-indigo-600" /> Password</CardTitle>
              <CardDescription>Change your account password.</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={changePassword} className="space-y-4">
            <Input label="Current password" type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} />
            <Input label="New password" type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} />
            <Button type="submit" className="w-full">Change password</Button>
          </form>
        </Card>

        {!isHR && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Resignation request</CardTitle>
                <CardDescription>Submit a request for HR review.</CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={submitResignation} className="space-y-4">
              <Input label="Last working day" type="date" value={resignation.lastWorkingDay} onChange={(event) => setResignation({ ...resignation, lastWorkingDay: event.target.value })} />
              <Textarea label="Reason" value={resignation.reason} onChange={(event) => setResignation({ ...resignation, reason: event.target.value })} />
              <Button type="submit" variant="outline" className="w-full">Submit resignation</Button>
            </form>
          </Card>
        )}
      </div>

      {!isHR && profile?.user?.employeeId && (
        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Employment history</CardTitle>
              <CardDescription>Promotions, transfers, warnings, and suspensions on your employee record.</CardDescription>
            </div>
          </CardHeader>
          <div className="grid gap-4 md:grid-cols-4">
            {['promotions', 'transfers', 'warnings', 'suspensions'].map((key) => (
              <div key={key} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold capitalize text-slate-950">{key}</p>
                <p className="mt-2 text-3xl font-bold text-indigo-700">{profile.user.employeeId[key]?.length || 0}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
