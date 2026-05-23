import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { AxiosError } from 'axios';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { authService } from '../services/auth';

export const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailError = useMemo(() => {
    if (!email) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address';
    return '';
  }, [email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setError('');

    if (emailError) return;

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast({ type: 'info', title: 'Reset email queued', message: 'If the account exists, a reset link will be sent.' });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Could not start password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <p className="text-sm font-semibold text-indigo-600">Forgot password</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Send a reset link</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your work email and we will trigger the reset workflow.</p>

        {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email address"
            icon={Mail}
            type="email"
            value={email}
            onBlur={() => setTouched(true)}
            onChange={(event) => setEmail(event.target.value)}
            error={touched ? emailError : ''}
            placeholder="name@company.com"
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Send reset link
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Back to <Link to="/login" className="font-semibold text-indigo-600">login</Link>
        </p>
      </Card>
    </div>
  );
};
