import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, KeyRound } from 'lucide-react';
import { AxiosError } from 'axios';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { authService } from '../services/auth';

export const EmployeeRegister: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = params.get('token') || '';
  const [employee, setEmployee] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordError = useMemo(() => {
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return 'Use 8+ characters with upper, lower, and a number';
    }

    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  }, [password, confirmPassword]);

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError('Invitation token is missing.');
        setLoadingInvite(false);
        return;
      }

      try {
        const response = await api.employees.verifyInvite(token);
        setEmployee(response.employee);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || 'Invitation is invalid or expired.');
      } finally {
        setLoadingInvite(false);
      }
    };

    loadInvite();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the terms to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.registerEmployee({ token, password, acceptTerms });
      toast({ type: 'success', title: 'Registration complete', message: 'You can now log in with your email and password.' });
      navigate('/login');
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Could not complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-indigo-600">Employee registration</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Finish setting up your account</h1>
        <p className="mt-2 text-sm text-slate-500">Confirm your invitation details and choose a secure password.</p>

        {loadingInvite ? (
          <div className="mt-6 h-32 animate-pulse rounded-lg bg-slate-100" />
        ) : error && !employee ? (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : (
          <>
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{employee?.name}</p>
                  <p className="text-sm text-slate-500">{employee?.position} • {employee?.department}</p>
                  <p className="text-sm text-slate-500">{employee?.email}</p>
                </div>
              </div>
            </div>

            {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input label="Password" icon={KeyRound} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Input label="Confirm password" icon={KeyRound} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1 accent-indigo-600" />
                <span>I confirm these details are correct and accept the IntelliHR employee access terms.</span>
              </label>
              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                Activate employee account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered? <Link to="/login" className="font-semibold text-indigo-600">Log in</Link>
        </p>
      </Card>
    </div>
  );
};
