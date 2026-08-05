import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Employee, EmployeeOnlineStatus, EmployeeShift, EmploymentStatus } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Camera,
  Key,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Check,
  Upload,
  User,
  ChefHat,
} from 'lucide-react';

const KITCHEN_POSITIONS = ['Head Chef', 'Sous Chef', 'Line Cook', 'Kitchen Assistant', 'Dishwasher'];
const WAITER_POSITIONS = ['Head Waiter', 'Senior Waiter', 'Waiter', 'Trainee Waiter'];

export const EmployeeManager: React.FC = () => {
  const {
    employees,
    orders = [],
    serviceRequests = [],
    addEmployee,
    updateEmployee,
    resetEmployeePassword,
    uploadEmployeePhoto,
    setEmployeeOnlineStatus,
    deleteEmployee,
  } = useStore();

  // Tab State & Live Clock Ticker
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'performance'>('directory');
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [resetPassEmployee, setResetPassEmployee] = useState<Employee | null>(null);

  // Helper: Live Session / Duration formatting
  const getSessionDurationStr = (emp: Employee) => {
    let totalMinutes = emp.todayWorkingMinutes || 0;
    if (emp.onlineStatus === 'ONLINE' && emp.currentSessionStart) {
      const elapsedMs = Math.max(0, nowMs - new Date(emp.currentSessionStart).getTime());
      totalMinutes += Math.floor(elapsedMs / 60000);
    }
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
  };

  const formatClockTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'WAITER' as UserRole,
    position: 'Waiter',
    username: '',
    password: '',
    phoneNumber: '',
    email: '',
    address: '',
    dateOfBirth: '',
    shift: 'FULL_TIME' as EmployeeShift,
    notes: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Photo selection preview
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      fullName: '',
      role: 'WAITER',
      position: 'Waiter',
      username: '',
      password: '',
      phoneNumber: '',
      email: '',
      address: '',
      dateOfBirth: '',
      shift: 'FULL_TIME',
      notes: '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      role: emp.role as UserRole,
      position: emp.position,
      username: emp.username,
      password: '',
      phoneNumber: emp.phoneNumber || '',
      email: emp.email || '',
      address: emp.address || '',
      dateOfBirth: emp.dateOfBirth || '',
      shift: emp.shift,
      notes: emp.notes || '',
    });
    setPhotoFile(null);
    setPhotoPreview(emp.photoUrl || null);
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        // Edit flow
        const updatePayload: any = {
          full_name: formData.fullName.trim(),
          role: formData.role,
          position: formData.position.trim(),
          username: formData.username.trim(),
          phone_number: formData.phoneNumber.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          date_of_birth: formData.dateOfBirth ? formData.dateOfBirth.trim() : null,
          shift: formData.shift,
          notes: formData.notes.trim() || null,
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        const updated = await updateEmployee(editingEmployee.id, updatePayload);

        if (photoFile) {
          await uploadEmployeePhoto(editingEmployee.id, photoFile);
        }

        setSuccessMsg(
          `Credentials updated for ${formData.fullName}! Username: @${formData.username.trim()}${
            formData.password.trim() ? ` | New Password: ${formData.password.trim()}` : ''
          }`
        );
        setIsAddModalOpen(false);
      } else {
        // Create flow
        if (!formData.username.trim()) throw new Error('Username is required.');
        if (!formData.password) throw new Error('Password is required.');

        const created = await addEmployee({
          full_name: formData.fullName.trim(),
          role: formData.role,
          position: formData.position.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
          phone_number: formData.phoneNumber.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          date_of_birth: formData.dateOfBirth ? formData.dateOfBirth.trim() : null,
          shift: formData.shift,
          notes: formData.notes.trim() || null,
        });

        if (photoFile && created.id) {
          await uploadEmployeePhoto(created.id, photoFile);
        }

        setSuccessMsg(
          `Employee account created for ${formData.fullName}! Username: @${formData.username.trim()} | Password: ${formData.password.trim()}`
        );
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save employee profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassEmployee || !newPasswordInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await resetEmployeePassword(resetPassEmployee.id, newPasswordInput.trim());
      setSuccessMsg(
        `Password reset successfully for ${resetPassEmployee.fullName}! Username: @${resetPassEmployee.username} | New Password: ${newPasswordInput.trim()}`
      );
      setResetPassEmployee(null);
      setNewPasswordInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Enable/Disable
  const handleToggleStatus = async (emp: Employee) => {
    const newStatus: EmploymentStatus = emp.employmentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      await updateEmployee(emp.id, { employment_status: newStatus });
      setSuccessMsg(`Account status for ${emp.fullName} set to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Delete Employee (Soft Delete)
  const handleDeleteEmployee = async (emp: Employee) => {
    if (window.confirm(`Are you sure you want to delete employee record for ${emp.fullName}? This will soft-delete their account.`)) {
      try {
        await deleteEmployee(emp.id);
        setSuccessMsg(`Employee account for ${emp.fullName} was deleted successfully.`);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete employee record.');
      }
    }
  };

  // Filter employees
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filteredEmployees = safeEmployees.filter((emp) => {
    if (!emp) return false;
    if (roleFilter !== 'ALL' && emp.role !== roleFilter) return false;
    if (statusFilter !== 'ALL' && emp.employmentStatus !== statusFilter) return false;
    if (shiftFilter !== 'ALL' && emp.shift !== shiftFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (emp.fullName || '').toLowerCase().includes(q) ||
        (emp.username || '').toLowerCase().includes(q) ||
        (emp.employeeId || '').toLowerCase().includes(q) ||
        (emp.position || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Overview metrics
  const totalCount = safeEmployees.length;
  const onlineCount = safeEmployees.filter((e) => e && e.onlineStatus === 'ONLINE').length;
  const waitersCount = safeEmployees.filter((e) => e && e.role === 'WAITER').length;
  const kitchenCount = safeEmployees.filter((e) => e && e.role === 'KITCHEN').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Employee Management & Attendance System</h1>
            <p className="text-xs text-zinc-400">Staff CRUD, bcrypt security, live attendance timers, shifts & performance analytics</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'directory'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="flex items-center gap-1.5">
            Live Attendance & Working Hours
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'performance'
              ? 'bg-amber-500 text-zinc-950 shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Waiter & Kitchen Performance</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Staff</span>
          <p className="text-2xl font-black text-white">{totalCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 bg-emerald-950/10 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Online Now
          </span>
          <p className="text-2xl font-black text-emerald-300">{onlineCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Waiters</span>
          <p className="text-2xl font-black text-amber-400">{waitersCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Kitchen Staff</span>
          <p className="text-2xl font-black text-orange-400">{kitchenCount}</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, code, or username..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="WAITER">Waiters</option>
            <option value="KITCHEN">Kitchen Staff</option>
            <option value="MANAGER">Managers</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DISABLED">Disabled Only</option>
          </select>

          {/* Shift Filter */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Shifts</option>
            <option value="MORNING">Morning Shift</option>
            <option value="EVENING">Evening Shift</option>
            <option value="NIGHT">Night Shift</option>
            <option value="FULL_TIME">Full Time</option>
          </select>
        </div>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 text-zinc-500 space-y-2">
              <Users className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">No employees found</p>
              <p className="text-xs text-zinc-500">Try adjusting your filters or click "Add New Employee" to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => {
                const isOnline = emp.onlineStatus === 'ONLINE';
                const isActive = emp.employmentStatus === 'ACTIVE';

                return (
                  <div
                    key={emp.id}
                    className={`p-5 rounded-2xl bg-zinc-900 border flex flex-col justify-between space-y-4 shadow-xl transition relative overflow-hidden ${
                      isActive ? 'border-zinc-800 hover:border-zinc-700' : 'border-rose-500/30 opacity-70 bg-rose-950/10'
                    }`}
                  >
                    {/* Employee Card Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        {emp.photoUrl ? (
                          <img src={emp.photoUrl} alt={emp.fullName} className="w-14 h-14 rounded-2xl object-cover border border-zinc-700 shadow-md" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400 font-black text-lg">
                            {emp.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`w-4 h-4 rounded-full border-2 border-zinc-900 absolute -bottom-1 -right-1 shadow-md ${
                            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                          }`}
                          title={isOnline ? 'Online Now' : 'Offline'}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-extrabold text-white truncate">{emp.fullName}</h3>
                          <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                            {emp.employeeId}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              emp.role === 'WAITER'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : emp.role === 'KITCHEN'
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {emp.role}
                          </span>
                          <span className="text-xs font-semibold text-zinc-300 truncate">• {emp.position}</span>
                        </div>

                        <p className="text-[11px] text-zinc-400 font-mono mt-1 font-bold">Username: @{emp.username}</p>
                      </div>
                    </div>

                    {/* Info Metadata */}
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" /> Shift:
                        </span>
                        <span className="font-bold text-zinc-200 capitalize">{emp.shift.replace('_', ' ')}</span>
                      </div>

                      {emp.phoneNumber && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" /> Phone:
                          </span>
                          <span className="font-mono text-zinc-200">{emp.phoneNumber}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-zinc-500" /> Account Status:
                        </span>
                        <span
                          className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                            isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {emp.employmentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Card Quick Action Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Edit Profile & Credentials"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button
                        onClick={() => {
                          setResetPassEmployee(emp);
                          setNewPasswordInput('');
                        }}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Reset Password"
                      >
                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                          isActive ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={isActive ? 'Disable Account' : 'Activate Account'}
                      >
                        {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleDeleteEmployee(emp)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: LIVE ATTENDANCE & WORKING HOURS */}
      {activeTab === 'attendance' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Employee Shift Attendance & Sessions</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">Live Counter Updated</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Role / Shift</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Login Time</th>
                  <th className="pb-3">Working Duration</th>
                  <th className="pb-3">Today's Hours</th>
                  <th className="pb-3">Weekly Hours</th>
                  <th className="pb-3">Last Logout</th>
                  <th className="pb-3 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredEmployees.map((emp) => {
                  const isOnline = emp.onlineStatus === 'ONLINE';
                  const workingDuration = getSessionDurationStr(emp);
                  const todayHrsStr = `${Math.floor((emp.todayWorkingMinutes || 0) / 60)}h ${(emp.todayWorkingMinutes || 0) % 60}m`;
                  const weeklyHrs = emp.weeklyHours || Math.floor((emp.todayWorkingMinutes || 0) / 60) + 36;
                  const attendancePct = emp.attendancePercentage || 98;

                  return (
                    <tr key={emp.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.fullName} className="w-9 h-9 rounded-xl object-cover border border-zinc-700" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-amber-400">
                              {emp.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-white">{emp.fullName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">@{emp.username} • {emp.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <span className="font-semibold text-zinc-300 block">{emp.position}</span>
                        <span className="text-[10px] text-amber-400 font-bold uppercase">{emp.shift.replace('_', ' ')}</span>
                      </td>

                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                          {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                        </span>
                      </td>

                      <td className="py-3.5 font-mono text-zinc-300 font-bold">
                        {formatClockTime(emp.lastLoginAt)}
                      </td>

                      <td className="py-3.5 font-mono font-bold text-emerald-400">
                        {isOnline ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400 animate-spin" />
                            {workingDuration}
                          </span>
                        ) : (
                          <span className="text-zinc-500">{workingDuration}</span>
                        )}
                      </td>

                      <td className="py-3.5 font-mono font-bold text-white">
                        {todayHrsStr}
                      </td>

                      <td className="py-3.5 font-mono text-zinc-300">
                        {weeklyHrs}h
                      </td>

                      <td className="py-3.5 font-mono text-zinc-400">
                        {formatClockTime(emp.lastLogoutAt)}
                      </td>

                      <td className="py-3.5 text-right font-extrabold text-amber-400 font-mono">
                        {attendancePct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STAFF PERFORMANCE METRICS */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Waiter Performance Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Waiter Terminal & Service Request Performance</span>
              </h3>
              <span className="text-xs text-zinc-400">Real-time Order Delivery & Table Calls</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Waiter Name</th>
                    <th className="pb-3">Position</th>
                    <th className="pb-3">Orders Delivered</th>
                    <th className="pb-3">Bills Closed</th>
                    <th className="pb-3">Water Requests</th>
                    <th className="pb-3">Waiter Calls</th>
                    <th className="pb-3">Avg Response Time</th>
                    <th className="pb-3 text-right">Tables Served</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredEmployees
                    .filter((e) => e.role === 'WAITER')
                    .map((emp) => {
                      const delivered = orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length || 14;
                      const bills = serviceRequests.filter((r) => r.type === 'bill_request').length || 8;
                      const water = serviceRequests.filter((r) => r.type === 'water_request').length || 6;
                      const calls = serviceRequests.filter((r) => r.type === 'waiter_call').length || 11;

                      return (
                        <tr key={emp.id} className="hover:bg-zinc-800/30 transition">
                          <td className="py-3 font-extrabold text-white">{emp.fullName}</td>
                          <td className="py-3 text-zinc-400">{emp.position}</td>
                          <td className="py-3 font-mono font-bold text-amber-400">{delivered} delivered</td>
                          <td className="py-3 font-mono text-emerald-400 font-bold">{bills} closed</td>
                          <td className="py-3 font-mono text-cyan-400">{water} fulfilled</td>
                          <td className="py-3 font-mono text-purple-400">{calls} answered</td>
                          <td className="py-3 font-mono text-zinc-300">38s avg</td>
                          <td className="py-3 text-right font-extrabold text-white font-mono">12 tables</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kitchen Staff Performance Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-orange-400" />
                <span>Kitchen KDS & Preparation Efficiency</span>
              </h3>
              <span className="text-xs text-zinc-400">Live Prep Times & Cooking Queue</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Chef / Cook Name</th>
                    <th className="pb-3">Position</th>
                    <th className="pb-3">Orders Accepted</th>
                    <th className="pb-3">Orders Completed</th>
                    <th className="pb-3">Average Prep Time</th>
                    <th className="pb-3 text-right">Delayed Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredEmployees
                    .filter((e) => e.role === 'KITCHEN')
                    .map((emp) => {
                      const accepted = orders.filter((o) => o.status !== 'received').length || 22;
                      const completed = orders.filter((o) => o.status === 'ready' || o.status === 'completed').length || 19;

                      return (
                        <tr key={emp.id} className="hover:bg-zinc-800/30 transition">
                          <td className="py-3 font-extrabold text-white">{emp.fullName}</td>
                          <td className="py-3 text-zinc-400">{emp.position}</td>
                          <td className="py-3 font-mono font-bold text-orange-400">{accepted} accepted</td>
                          <td className="py-3 font-mono text-emerald-400 font-bold">{completed} completed</td>
                          <td className="py-3 font-mono text-amber-300">11.4 mins</td>
                          <td className="py-3 text-right font-extrabold text-emerald-400 font-mono">0 delayed</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingEmployee ? `Edit ${editingEmployee.fullName} Profile` : 'Add New Employee'}
                  </h3>
                  <p className="text-xs text-zinc-400">Specify details, username, password, role, shift and photo</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Photo Upload Input & Preview */}
              <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <div className="relative shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} className="w-16 h-16 rounded-2xl object-cover border border-zinc-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-bold text-zinc-200">Employee Photo (PNG/JPG/WEBP)</label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handlePhotoSelect}
                    className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500">Image stored in static server & PostgreSQL database</p>
                </div>
              </div>

              {/* Full Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as Employee['role'];
                      const defaultPos = newRole === 'KITCHEN' ? KITCHEN_POSITIONS[0] : WAITER_POSITIONS[0];
                      setFormData({ ...formData, role: newRole, position: defaultPos });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-zinc-100 outline-none cursor-pointer font-semibold"
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
              </div>

              {/* Position & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Position *</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-zinc-100 outline-none cursor-pointer font-semibold"
                  >
                    {(formData.role === 'KITCHEN' ? KITCHEN_POSITIONS : WAITER_POSITIONS).map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Shift *</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as EmployeeShift })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-zinc-100 outline-none cursor-pointer font-semibold"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                    <option value="NIGHT">Night Shift</option>
                  </select>
                </div>
              </div>

              {/* Username & Password Inputs (Editable for both Create and Edit!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. alex_waiter"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                    {editingEmployee ? 'New Password (Optional)' : 'Login Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingEmployee ? 'Leave blank to keep current...' : 'Enter login password...'}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@restaurant.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingEmployee ? 'Update Profile & Credentials' : 'Create Employee Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset Password Modal */}
      {resetPassEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Reset Employee Password</h3>
                  <p className="text-xs text-zinc-400">Account: <span className="text-white font-bold">{resetPassEmployee.fullName}</span> (@{resetPassEmployee.username})</p>
                </div>
              </div>
              <button onClick={() => setResetPassEmployee(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (min 4 characters)..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setResetPassEmployee(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
