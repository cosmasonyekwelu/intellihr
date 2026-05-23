import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, KeyRound, Mail, Phone, UserRound, Users } from 'lucide-react';
import { AxiosError } from 'axios';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { authService, saveSession } from '../services/auth';

const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);
  const errors = useMemo(() => ({
    name: !form.name.trim() ? 'Full name is required' : '',
    email: !form.email ? 'Email is required' : !/^\S+@\S+\.\S+$/.test(form.email) ? 'Enter a valid email address' : '',
    company: !form.company.trim() ? 'Company name is required' : '',
    password: strength < 4 ? 'Use 8+ characters with upper, lower, and a number' : '',
    confirmPassword: form.confirmPassword !== form.password ? 'Passwords do not match' : ''
  }), [form, strength]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field: keyof typeof form) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, company: true, password: true, confirmPassword: true });

    if (Object.values(errors).some(Boolean)) return;

    setServerError('');
    setLoading(true);

    try {
      const response = await authService.signup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        password: form.password
      });
      saveSession(response);
      toast({ type: 'success', title: 'Account created', message: 'You are signed in and ready to work.' });
      navigate('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setServerError(axiosError.response?.data?.message || 'We could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden rounded-lg bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500 text-lg font-bold">iH</div>
            <div>
              <p className="text-lg font-bold">IntelliHR</p>
              <p className="text-sm text-slate-400">SaaS HR workspace</p>
            </div>
          </div>

          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-indigo-200">
              <Users className="h-4 w-4" />
              HR-led onboarding
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">Create your HR operating system in minutes.</h1>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Invite people, manage leave and attendance, and keep payroll workflows connected as your company grows.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-300">
            {['Automatic HR session after signup', 'Company field ready for tenancy', 'Employee access by invitation only'].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4">{item}</div>
            ))}
          </div>
        </aside>

        <main className="flex items-center">
          <Card className="w-full p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold text-indigo-600">Create account</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Create your HR workspace</h2>
              <p className="mt-2 text-sm text-slate-500">This sign-up is for HR Managers. Employees join from invitation links.</p>
            </div>

            {serverError && (
              <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="signup_name"
                  label="Full name"
                  icon={UserRound}
                  value={form.name}
                  onBlur={() => markTouched('name')}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="John Doe"
                  error={touched.name ? errors.name : ''}
                />
                <Input
                  id="signup_email"
                  label="Email address"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onBlur={() => markTouched('email')}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="john@company.com"
                  error={touched.email ? errors.email : ''}
                />
                <Input
                  id="signup_phone"
                  label="Phone number"
                  icon={Phone}
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="+1 555 0199"
                  hint="Optional"
                />
                <Input
                  id="signup_company"
                  label="Company name"
                  icon={Building2}
                  value={form.company}
                  onBlur={() => markTouched('company')}
                  onChange={(event) => updateField('company', event.target.value)}
                  placeholder="ACME Ltd"
                  error={touched.company ? errors.company : ''}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Input
                    id="signup_password"
                    label="Password"
                    icon={KeyRound}
                    type="password"
                    value={form.password}
                    onBlur={() => markTouched('password')}
                    onChange={(event) => updateField('password', event.target.value)}
                    placeholder="Create a secure password"
                    error={touched.password ? errors.password : ''}
                  />
                  <div>
                    <div className="grid grid-cols-5 gap-1">
                      {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className={`h-1.5 rounded-full ${index < strength ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">{strengthLabels[Math.max(strength - 1, 0)]}</p>
                  </div>
                </div>
                <Input
                  id="signup_confirm_password"
                  label="Confirm password"
                  icon={KeyRound}
                  type="password"
                  value={form.confirmPassword}
                  onBlur={() => markTouched('confirmPassword')}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  placeholder="Repeat your password"
                  error={touched.confirmPassword ? errors.confirmPassword : ''}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Create HR account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Log in
              </Link>
            </p>
          </Card>
        </main>
      </div>
    </div>
  );
};
