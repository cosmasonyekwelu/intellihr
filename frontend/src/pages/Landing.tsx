import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Zap,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase">Intelli<span className="text-indigo-500">HR</span></span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <Link to="/login" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-8 animate-fade-in">
            <Bot className="w-3.5 h-3.5" />
            AI-Powered HR Revolution
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-[1.1]">
            Automate your HR & Payroll <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">with Intelligence.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            The all-in-one platform for modern companies. Manage employees, process payroll,
            and automate workflows with our GPT-powered HR Agent.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold transition-all flex items-center justify-center gap-2">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Powerful Automation Engine</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Built on the latest tech stack to ensure speed, security, and reliability for your workforce.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI HR Copilot</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Natural language queries for payroll analysis, attendance summaries, and performance reviews.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Payroll Orchestration</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                One-click payroll cycles with n8n integration. Automated PDF payslips and bank notifications.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Workforce Control</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Complete employee lifecycle management, from hire to retire, with advanced filtering and CRUD.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="p-12 rounded-[40px] bg-gradient-to-br from-indigo-600 to-indigo-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
            <h2 className="text-4xl font-black text-white mb-6 tracking-tight">Ready to modernize your company?</h2>
            <p className="text-indigo-100 mb-10 text-lg opacity-90">Join 500+ teams using IntelliHR to save 20+ hours on administrative tasks every week.</p>
            <Link to="/login" className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-slate-100 transition-all shadow-xl">
              Get Access Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 opacity-50">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold tracking-tighter text-white uppercase italic">IntelliHR Platform</span>
          </div>
          <p className="text-slate-600 text-xs font-medium">
            © 2026 IntelliHR Automation. All rights reserved. Built with OpenAI & n8n.
          </p>
        </div>
      </footer>
    </div>
  );
};
