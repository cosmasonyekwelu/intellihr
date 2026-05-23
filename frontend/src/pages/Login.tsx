import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { AxiosError } from 'axios';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { authService, saveSession } from '../services/auth';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => ({
    email: !email ? 'Email is required' : !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email address' : '',
    password: !password ? 'Password is required' : ''
  }), [email, password]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (errors.email || errors.password) return;

    setError('');
    setLoading(true);

    try {
      const data = await authService.login({ email, password });
      saveSession(data);
      toast({ type: 'success', title: 'Welcome back', message: 'Your workspace is ready.' });
      navigate('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_560px]">
      <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-500 text-lg font-bold">iH</div>
          <div>
            <p className="text-lg font-bold">IntelliHR</p>
            <p className="text-sm text-slate-400">Enterprise people operations</p>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-indigo-200">
            <ShieldCheck className="h-4 w-4" />
            Secure HR command center
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Manage people, attendance, leave, and payroll from one clean workspace.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Built for HR teams that need role-aware access, workflow automation, and a calmer daily operating rhythm.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          {['JWT protected routes', 'n8n email workflows', 'Role-based access'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">iH</div>
            <h1 className="text-2xl font-bold text-slate-950">IntelliHR</h1>
          </div>

          <Card className="p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold text-indigo-600">Sign in</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Open your workspace</h2>
              <p className="mt-2 text-sm text-slate-500">Use your company email to continue.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                id="input_email"
                label="Email address"
                icon={Mail}
                type="email"
                value={email}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                error={touched.email ? errors.email : ''}
                autoComplete="email"
              />

              <Input
                id="input_password"
                label="Password"
                icon={KeyRound}
                type="password"
                value={password}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                error={touched.password ? errors.password : ''}
                autoComplete="current-password"
              />

              <div className="flex items-center justify-end text-sm">
                <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </Link>
              </div>

              <Button id="btn_login_submit" type="submit" size="lg" className="w-full" loading={loading}>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              New to IntelliHR?{' '}
              <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Create an account
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};
