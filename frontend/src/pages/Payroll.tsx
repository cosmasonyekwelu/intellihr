import React, { useEffect, useState } from 'react';
import { 
  CircleDollarSign, 
  Settings, 
  Download, 
  HelpCircle,
  Play,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const Payroll: React.FC = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [n8nStatus, setN8nStatus] = useState('');

  const userString = localStorage.getItem('intellihr_user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr_manager';

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const data = await api.payroll.list({ month, year });
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed fetching payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const handleRunPayroll = async () => {
    if (!window.confirm(`Are you sure you want to execute the monthly payroll cycle for ${month}/${year}?`)) return;

    setRunning(true);
    setN8nStatus('Contacting n8n webhook triggers...');

    try {
      const response = await api.payroll.run({ month, year });
      setN8nStatus(`Payroll cycle processed! Local: ${response.localCalculations ? 'Yes' : 'No'}, Workers Calculated: ${response.count}`);
      fetchPayroll();
    } catch (err: any) {
      setN8nStatus(`Failed to trigger: ${err.message}. Running fallback local calculations...`);
      // Re-fetch to load fallbacks
      setTimeout(() => {
        fetchPayroll();
      }, 1000);
    } finally {
      setRunning(false);
    }
  };

  const getDeductionsTotal = (ded: any) => {
    if (!ded) return 0;
    return (ded.tax || 0) + (ded.pension || 0) + (ded.loan || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Payroll Ledger</h1>
          <p className="text-xs text-slate-500">Monitor salaries, bonuses, and tax deductions calculations</p>
        </div>

        {/* Month selectors */}
        <div className="flex gap-3 items-center">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                {new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'long' })}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Manual Trigger Panel (HR managers only) */}
      {isAdminOrHR && (
        <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-indigo-400" />
              Administrative Operations Control
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal max-w-xl">
              Initiate calculations, generate PDF payslips, and dispatch email/WhatsApp alerts automatically using the n8n scheduler.
            </p>
            {n8nStatus && (
              <p className="text-[10px] text-indigo-300 font-semibold font-mono animate-pulse">{n8nStatus}</p>
            )}
          </div>

          <button
            onClick={handleRunPayroll}
            disabled={running}
            id="btn_trigger_payroll"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01]"
          >
            <Play className="w-4 h-4" />
            {running ? 'Processing payroll...' : 'Execute Payroll Cycle'}
          </button>
        </div>
      )}

      {/* Payroll Registry table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading payroll ledger...</div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
            <HelpCircle className="w-7 h-7 text-slate-650 mx-auto" />
            <p>No payroll records computed for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Gross Salary</th>
                  <th className="pb-3 font-semibold">Bonuses</th>
                  <th className="pb-3 font-semibold">Deductions</th>
                  <th className="pb-3 font-semibold">Net Take-Home</th>
                  <th className="pb-3 text-right font-semibold">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-950/20 group">
                    <td className="py-4">
                      <div className="font-bold text-slate-200">{rec.employeeId?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{rec.employeeId?.position || 'Employee'}</div>
                    </td>
                    <td className="py-4 font-mono text-slate-300">
                      ${rec.grossSalary.toLocaleString()}
                    </td>
                    <td className="py-4 font-mono text-emerald-400 font-bold">
                      +${rec.bonuses.toLocaleString()}
                    </td>
                    <td className="py-4 font-mono text-rose-400">
                      -${getDeductionsTotal(rec.deductions).toLocaleString()}
                      <span className="text-[9px] text-slate-500 block">
                        (Tax: ${rec.deductions?.tax}, Pen: ${rec.deductions?.pension})
                      </span>
                    </td>
                    <td className="py-4 font-mono text-slate-100 font-extrabold text-sm">
                      ${rec.netSalary.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      {rec.payslipUrl ? (
                        <a
                          href={rec.payslipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-indigo-600 hover:text-white text-slate-400 font-bold transition-all text-[10px] inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Payslip PDF
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
