import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  TrendingDown, 
  X, 
  UserPlus
} from 'lucide-react';
import { api } from '../services/api';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal forms
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 3000,
    status: 'active',
    performanceRating: 3,
    photo: null as File | null
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.employees.list({ search, department, status });
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('position', formData.position);
      data.append('department', formData.department);
      data.append('salary', formData.salary.toString());
      data.append('status', formData.status);
      data.append('performanceRating', formData.performanceRating.toString());
      if (formData.photo) {
        data.append('photo', formData.photo);
      }

      if (modalMode === 'create') {
        await api.employees.create(data);
      } else {
        await api.employees.update(selectedId, data);
      }
      setShowModal(false);
      fetchEmployees();
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        salary: 3000,
        status: 'active',
        performanceRating: 3,
        photo: null
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleEdit = (emp: any) => {
    setSelectedId(emp._id);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      position: emp.position,
      department: emp.department,
      salary: emp.salary,
      status: emp.status,
      performanceRating: emp.performanceRating || 3,
      photo: null
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.employees.delete(id);
      fetchEmployees();
    } catch (err) {
      console.error('Failed deleting employee:', err);
    }
  };

  const departments = ['Engineering', 'Sales', 'Marketing', 'Human Resources', 'Tech'];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500">Add, modify, and review employee active directories</p>
        </div>
        
        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              position: '',
              department: '',
              salary: 3000,
              status: 'active',
              performanceRating: 3,
              photo: null
            });
            setModalMode('create');
            setShowModal(true);
          }}
          id="btn_add_employee"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01]"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Advanced Filter Panel */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, email..."
            id="input_search_employee"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-500 transition-colors focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
          
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            id="filter_department"
            className="px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            id="filter_status"
            className="px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>

        </div>
      </div>

      {/* Directory Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading directory...</div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No employees match this filter parameter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Photo</th>
                  <th className="pb-3 font-semibold">Employee</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Salary (Mo)</th>
                  <th className="pb-3 font-semibold">Performance</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-950/20 group transition-colors">
                    <td className="py-4">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold">
                          {emp.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-slate-200">{emp.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{emp.position} • {emp.email}</div>
                    </td>
                    <td className="py-4 text-slate-350 font-medium">
                      {emp.department}
                    </td>
                    <td className="py-4 font-mono font-bold text-slate-200">
                      ${emp.salary.toLocaleString()}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${emp.performanceRating >= 4 ? 'bg-emerald-500/10 text-emerald-400' : emp.performanceRating <= 2 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                          {emp.performanceRating}/5
                        </span>
                        {emp.performanceRating >= 4 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : emp.performanceRating <= 2 ? (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        emp.status === 'on_leave' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {emp.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 transition-all inline-flex items-center"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 transition-all inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over or Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-2xl animate-in scale-in duration-200">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {modalMode === 'create' ? 'Add New Employee' : 'Edit Employee Settings'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none"
                    placeholder="john@company.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none"
                    placeholder="+1 555-0199"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Dept</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none"
                    placeholder="Senior Developer"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Salary ($)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                    <span>Performance Rating (Review)</span>
                    <span className="text-indigo-400 font-bold font-mono">{formData.performanceRating}/5</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.performanceRating}
                    onChange={(e) => setFormData({ ...formData, performanceRating: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono">
                    <span>1 (Poor)</span>
                    <span>3 (Normal)</span>
                    <span>5 (Outstanding)</span>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn_submit_employee_modal"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/10 transition-all"
                >
                  {modalMode === 'create' ? 'Confirm Hiring' : 'Save Adjustments'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
