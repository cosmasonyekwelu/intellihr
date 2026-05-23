import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, KeyRound, Mail, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);

    try {
      const data = await api.auth.login({ email, password });
      
      // Store token and user properties
      localStorage.setItem('intellihr_token', data.token);
      localStorage.setItem('intellihr_user', JSON.stringify(data.user));

      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'hr' | 'employee') => {
    if (role === 'hr') {
      setEmail('hr@intellihr.com');
    } else {
      setEmail('employee@intellihr.com');
    }
    setPassword('password123');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0a0f1d] overflow-hidden px-4">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] glow-bg" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[150px] glow-bg" style={{ animationDelay: '2s' }} />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Logo brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-500/20 mx-auto text-xl">
            iH
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            IntelliHR Portal
          </h1>
          <p className="text-slate-500 text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI & n8n Orchestrated SaaS
          </p>
        </div>

        {/* Login Glassmorphic Box */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-100">Sign In</h3>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  id="input_email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-600 transition-all focus:outline-none"
                  required
                />
                <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  id="input_password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-600 transition-all focus:outline-none"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              id="btn_login_submit"
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In To Workspace'}
            </button>

          </form>

          {/* Quick-fill helper chips for sandbox runs */}
          <div className="border-t border-slate-800/80 pt-5 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">
              Quick Sandbox Credentials
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickFill('hr')}
                className="px-3 py-2 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-indigo-400 flex items-center justify-center gap-1.5 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                HR Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('employee')}
                className="px-3 py-2 rounded-xl bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Employee
              </button>
            </div>
          </div>

        </div>

        <p className="text-center text-[10px] text-slate-600">
          IntelliHR Platform © 2026. All rights secured under system TLS encryption.
        </p>

      </div>
    </div>
  );
};
