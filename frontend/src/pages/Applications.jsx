import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FolderClock,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Building,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Applications() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/services/my-applications');
      setApplications(res.data.items || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800">
            <FolderClock size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {t('nav_applications')}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified tracking records of public service applications processed through the Autonomous Bureaucracy Agent.
            </p>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <FolderClock size={40} className="text-slate-600 mx-auto" />
            <h3 className="font-bold text-sm text-slate-200">No applications filed yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven't initiated any government services yet. Explore Government Services to apply for scholarships, solar subsidies, and certificates.
            </p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    {app.reference_number}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      app.status === 'Submitted'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : app.status === 'Awaiting User Approval'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{app.service_name}</h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Building size={13} className="text-slate-500" />
                    <span>Portal: {app.portal_name}</span>
                  </span>
                  <span className="flex items-center space-x-1 font-mono text-[11px]">
                    <Calendar size={12} className="text-slate-500" />
                    <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                  </span>
                </div>

                {app.next_action && (
                  <p className="text-xs text-amber-300/90 font-medium">
                    Next Action: {app.next_action}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                {app.receipt_url && (
                  <button
                    onClick={() => setSelectedReceipt(app.receipt_url)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition"
                  >
                    <Eye size={13} />
                    <span>View Official Receipt</span>
                  </button>
                )}

                <a
                  href={app.official_tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md flex items-center space-x-1.5 transition"
                >
                  <span>Track on Portal</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Official Government Submission Receipt</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
              <img src={selectedReceipt} alt="Receipt" className="w-full object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
