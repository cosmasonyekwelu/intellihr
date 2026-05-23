import React, { useEffect, useMemo, useState } from 'react';
import { Download, HelpCircle, Play, Settings } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Input';
import { Table, TableShell, Td, Th } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import { getCurrentUser } from '../services/auth';

export const Payroll: React.FC = () => {
  const { toast } = useToast();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [n8nStatus, setN8nStatus] = useState('');
  const user = getCurrentUser();
  const isHR = user?.role === 'hr';

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const data = await api.payroll.list({ month, year });
      setRecords(data.records || []);
    } catch {
      toast({ type: 'error', title: 'Could not load payroll' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const totals = useMemo(() => {
    return records.reduce((summary, record) => ({
      gross: summary.gross + record.grossSalary,
      bonuses: summary.bonuses + record.bonuses,
      net: summary.net + record.netSalary
    }), { gross: 0, bonuses: 0, net: 0 });
  }, [records]);

  const handleRunPayroll = async () => {
    if (!window.confirm(`Execute payroll cycle for ${month}/${year}?`)) return;

    setRunning(true);
    setN8nStatus('Contacting n8n workflow...');

    try {
      const response = await api.payroll.run({ month, year });
      setN8nStatus(`Processed ${response.count} payroll records.`);
      toast({ type: 'success', title: 'Payroll cycle complete' });
      fetchPayroll();
    } catch (err: any) {
      setN8nStatus(`Workflow failed: ${err.message}`);
      toast({ type: 'error', title: 'Payroll run failed' });
    } finally {
      setRunning(false);
    }
  };

  const deductionsTotal = (deductions: any) => {
    if (!deductions) return 0;
    return (deductions.tax || 0) + (deductions.pension || 0) + (deductions.loan || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Payroll</h1>
          <p className="mt-1 text-sm text-slate-500">Review compensation, deductions, and generated payslips.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-72">
          <Select value={month} onChange={(event) => setMonth(Number(event.target.value))} aria-label="Month">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
              <option key={item} value={item}>{new Date(2000, item - 1, 1).toLocaleString(undefined, { month: 'long' })}</option>
            ))}
          </Select>
          <Select value={year} onChange={(event) => setYear(Number(event.target.value))} aria-label="Year">
            {[2025, 2026, 2027].map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-slate-500">Gross salary</p><p className="mt-2 text-3xl font-bold text-slate-950">${totals.gross.toLocaleString()}</p></Card>
        <Card><p className="text-sm text-slate-500">Bonuses</p><p className="mt-2 text-3xl font-bold text-emerald-700">${totals.bonuses.toLocaleString()}</p></Card>
        <Card><p className="text-sm text-slate-500">Net payroll</p><p className="mt-2 text-3xl font-bold text-indigo-700">${totals.net.toLocaleString()}</p></Card>
      </div>

      {isHR && (
        <Card className="border-indigo-200 bg-indigo-50">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-indigo-900">
                <Settings className="h-4 w-4" />
                Payroll operations control
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-900/75">
                Trigger calculations, generate PDF payslips, and hand off notifications to n8n workflows.
              </p>
              {n8nStatus && <p className="mt-2 text-sm font-semibold text-indigo-700">{n8nStatus}</p>}
            </div>
            <Button id="btn_trigger_payroll" onClick={handleRunPayroll} loading={running}>
              <Play className="h-4 w-4" />
              Execute payroll
            </Button>
          </div>
        </Card>
      )}

      <Card padded={false}>
        <CardHeader className="mb-0 border-b border-slate-200 p-5">
          <div>
            <CardTitle>Payroll ledger</CardTitle>
            <CardDescription>Monthly payroll records and payslip files.</CardDescription>
          </div>
        </CardHeader>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-950">No payroll records</p>
            <p className="mt-1 text-sm text-slate-500">Run payroll or choose another month.</p>
          </div>
        ) : (
          <TableShell className="border-0">
            <Table>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Gross</Th>
                  <Th>Bonuses</Th>
                  <Th>Deductions</Th>
                  <Th>Net</Th>
                  <Th className="text-right">Payslip</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record._id} className="transition hover:bg-slate-50">
                    <Td>
                      <p className="font-semibold text-slate-950">{record.employeeId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{record.employeeId?.position || 'Employee'}</p>
                    </Td>
                    <Td className="font-semibold text-slate-950">${record.grossSalary.toLocaleString()}</Td>
                    <Td className="font-semibold text-emerald-700">+${record.bonuses.toLocaleString()}</Td>
                    <Td className="font-semibold text-rose-700">-${deductionsTotal(record.deductions).toLocaleString()}</Td>
                    <Td className="text-base font-bold text-slate-950">${record.netSalary.toLocaleString()}</Td>
                    <Td className="text-right">
                      {record.payslipUrl ? (
                        <a href={record.payslipUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">Unavailable</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableShell>
        )}
      </Card>
    </div>
  );
};
