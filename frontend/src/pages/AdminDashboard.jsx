import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  Building,
  TrendingUp,
  MapPin,
  Eye,
  Edit,
  Save,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { user, isOfficerOrAdmin } = useAuth();

  const [grievances, setGrievances] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Active Selected Grievance for Review / Status Update
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateSeverity, setUpdateSeverity] = useState('');
  const [updateDepartment, setUpdateDepartment] = useState('');
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOfficerOrAdmin()) {
      fetchAdminData();
    }
  }, [statusFilter, severityFilter, departmentFilter]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      let gUrl = '/api/v1/admin/grievances?';
      if (statusFilter) gUrl += `status=${encodeURIComponent(statusFilter)}&`;
      if (severityFilter) gUrl += `severity=${encodeURIComponent(severityFilter)}&`;
      if (departmentFilter) gUrl += `department=${encodeURIComponent(departmentFilter)}&`;

      const [gRes, aRes, oRes] = await Promise.all([
        axios.get(gUrl),
        axios.get('/api/v1/admin/analytics'),
        axios.get('/api/v1/admin/officers')
      ]);

      setGrievances(gRes.data.items || []);
      setAnalytics(aRes.data);
      setOfficers(oRes.data || []);
    } catch (err) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (g) => {
    setSelectedGrievance(g);
    setUpdateStatus(g.status);
    setUpdateSeverity(g.severity);
    setUpdateDepartment(g.department);
    setAssignedOfficerId(g.assigned_officer_id || '');
    setResolutionNotes(g.resolution_notes || '');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    setUpdating(true);
    try {
      const payload = {
        status: updateStatus,
        severity: updateSeverity,
        department: updateDepartment,
        assigned_officer_id: assignedOfficerId ? parseInt(assignedOfficerId) : null,
        resolution_notes: resolutionNotes || null
      };

      await axios.put(`/api/v1/admin/grievances/${selectedGrievance.id}/status`, payload);
      alert('Grievance status and audit history successfully updated.');
      setSelectedGrievance(null);
      fetchAdminData();
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOfficerOrAdmin()) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xs">
        <ShieldAlert size={48} className="text-red-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Officer & Administration Portal is strictly restricted to verified Municipal Officers, Department Administrators, and Platform Operators.
        </p>
      </div>
    );
  }

  const validStatuses = [
    'Submitted',
    'AI Analyzed',
    'Department Suggested',
    'Assigned',
    'Acknowledged',
    'In Progress',
    'Resolution Submitted',
    'Resolved',
    'Rejected'
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header — Government White Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0c2340] tracking-tight">
                Municipal Officer & Administration Portal
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized jurisdictional triage, officer assignment, AI classification review, and complaint lifecycle management.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-700 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Role: <strong>{user?.role}</strong> | Dept: <strong>{user?.department || 'All Departments'}</strong>
          </div>
        </div>

        {/* Live Analytics Overview Bar */}
        {analytics && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">Total Grievances</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{analytics.total_grievances}</p>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
              <span className="text-[11px] text-amber-800 font-medium">Pending Triage</span>
              <p className="text-xl font-bold text-amber-700 mt-1">{analytics.pending_triaged}</p>
            </div>
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
              <span className="text-[11px] text-blue-800 font-medium">In Progress</span>
              <p className="text-xl font-bold text-blue-700 mt-1">{analytics.in_progress}</p>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-medium">Resolved</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">{analytics.resolved}</p>
            </div>
            <div className="bg-red-50/60 p-3 rounded-xl border border-red-200">
              <span className="text-[11px] text-red-800 font-medium">Critical Unresolved</span>
              <p className="text-xl font-bold text-red-700 mt-1">{analytics.critical_unresolved}</p>
            </div>
          </div>
        )}
      </div>

      {/* Triage Grievances Table & Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 shadow-xs"
            >
              <option value="">All Statuses</option>
              {validStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 shadow-xs"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <span className="text-slate-500 font-mono text-[11px]">
            {grievances.length} jurisdictional records found
          </span>
        </div>

        {/* Records List */}
        <div className="space-y-3">
          {grievances.map((g) => (
            <div
              key={g.id}
              className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {g.ticket_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      g.severity === 'Critical'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : g.severity === 'High'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {g.severity}
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                    {g.status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#0c2340]">{g.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-1">{g.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span>Category: <strong className="text-slate-700">{g.category}</strong></span>
                  <span>•</span>
                  <span>Dept: <strong className="text-slate-700">{g.department}</strong></span>
                  <span>•</span>
                  <span>Citizen: {g.author_name}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleOpenReview(g)}
                  className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center space-x-1"
                >
                  <Edit size={13} />
                  <span>Review & Transition Status</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review / Status Transition Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono text-blue-700 font-bold">
                  {selectedGrievance.ticket_number}
                </span>
                <h3 className="text-base font-bold text-[#0c2340]">
                  Officer Review & Status Transition
                </h3>
              </div>
              <button
                onClick={() => setSelectedGrievance(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Evidence Image with CV */}
            {selectedGrievance.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-60 flex items-center justify-center">
                <img src={selectedGrievance.image_url} alt="Evidence" className="max-h-60 object-contain" />
              </div>
            )}

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Update Status</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
                  >
                    {validStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Override Severity</label>
                  <select
                    value={updateSeverity}
                    onChange={(e) => setUpdateSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Responsible Department</label>
                  <input
                    type="text"
                    value={updateDepartment}
                    onChange={(e) => setUpdateDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Officer</label>
                  <select
                    value={assignedOfficerId}
                    onChange={(e) => setAssignedOfficerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Unassigned</option>
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.full_name} ({o.department || 'Officer'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resolution Notes / Investigation Audit Log
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Record dispatch of repair crew, contractor details, or verification outcome..."
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl shadow-xs transition"
                >
                  {updating ? 'Saving Audit Record...' : 'Confirm Status Transition & Update Audit Trail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
