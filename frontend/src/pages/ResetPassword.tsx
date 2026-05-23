import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, KeyRound } from 'lucide-react';
import { AxiosError } from 'axios';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { authService, saveSession } from '../services/auth';

export const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validationError = useMemo(() => {
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return 'Use 8+ characters with upper, lower, and a number';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return '';
  }, [password, confirmPassword]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email || !token) {
      setError('Reset link is missing required details.');
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({ email, token, password });
      saveSession(response);
      toast({ type: 'success', title: 'Password updated', message: 'You are signed in with your new password.' });
      navigate('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <p className="text-sm font-semibold text-indigo-600">Password reset</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Create a new password</h1>
        <p className="mt-2 text-sm text-slate-500">Choose a secure password for {email || 'your account'}.</p>

        {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="New password" icon={KeyRound} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Input label="Confirm password" icon={KeyRound} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Update password
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered it? <Link to="/login" className="font-semibold text-indigo-600">Log in</Link>
        </p>
      </Card>
    </div>
  );
};
