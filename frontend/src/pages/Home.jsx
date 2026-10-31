import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  AlertTriangle,
  Briefcase,
  CheckCheck,
  Bot,
  ArrowRight,
  Volume2,
  Calendar,
  Building,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import VoicePlayer from '../components/VoicePlayer';

export default function Home() {
  const { language, t } = useLanguage();
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSpeechText, setActiveSpeechText] = useState(null);
  const [activeSpeechTitle, setActiveSpeechTitle] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [language]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [policiesRes, analyticsRes, grievancesRes] = await Promise.all([
        axios.get(`/api/v1/policies/?language=${language}&limit=4`),
        axios.get('/api/v1/admin/analytics'),
        axios.get('/api/v1/grievances/?limit=3&sort_by=latest')
      ]);

      setAnnouncements(policiesRes.data.items || []);
      setAnalytics(analyticsRes.data);
      setRecentGrievances(grievancesRes.data.items || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLivePIB = async () => {
    try {
      await axios.post('/api/v1/policies/refresh-live-pib');
      fetchDashboardData();
    } catch (err) {
      console.error('Refresh PIB error:', err);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-blue-900/60 border border-blue-700/50 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 mb-4">
            <ShieldCheck size={14} className="text-amber-400" />
            <span>Digital Governance & Citizen Rights Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t('slogan')}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {t('supporting_slogan')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
            <Link
              to="/policies"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg shadow-blue-900/40 transition flex items-center space-x-2"
            >
              <FileText size={18} />
              <span>{t('check_eligibility')}</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/grievances"
              className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center space-x-2"
            >
              <AlertTriangle size={18} className="text-amber-400" />
              <span>{t('submit_grievance')}</span>
            </Link>

            <Link
              to="/verify"
              className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center space-x-2"
            >
              <CheckCheck size={18} />
              <span>Verify News & Claims</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Public Accountability Metrics Banner (Strictly from actual DB) */}
      {analytics && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <span>Live Municipal Accountability Tracker</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Computed from live civic records. Zero simulated metrics.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Resolution Rate: <strong className="text-emerald-400">{analytics.resolution_rate_percent}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-xs text-slate-400">Total Grievances</span>
              <p className="text-2xl font-bold text-white mt-1">{analytics.total_grievances}</p>
            </div>
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-xs text-amber-400">Pending / Triaged</span>
              <p className="text-2xl font-bold text-amber-300 mt-1">{analytics.pending_triaged}</p>
            </div>
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-xs text-blue-400">In Active Progress</span>
              <p className="text-2xl font-bold text-blue-300 mt-1">{analytics.in_progress}</p>
            </div>
            <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-xs text-emerald-400">Successfully Resolved</span>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{analytics.resolved}</p>
            </div>
          </div>
        </section>
      )}

      {/* Four Interconnected Problem Statement Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Unified Citizen Technology Ecosystem
            </h2>
            <p className="text-xs text-slate-400">
              Interconnected governance solutions delivering transparency, accountability, and empowerment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Link
            to="/policies"
            className="group bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl p-5 transition flex flex-col justify-between hover:shadow-xl hover:shadow-blue-950/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-700/50 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition">
                1. Multilingual Policy & Scheme Intelligence
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Live official PIB notifications, plain-language legal explainers, personalized scheme matching, and regional voice narration.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Explore Schemes</span>
              <ArrowRight size={13} />
            </span>
          </Link>

          {/* Card 2 */}
          <Link
            to="/grievances"
            className="group bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-2xl p-5 transition flex flex-col justify-between hover:shadow-xl hover:shadow-amber-950/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-700/50 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition">
                2. Transparent Civic Grievance Triage
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Reddit-inspired civic feed, computer vision pothole/leakage detection, speech-to-text recording, auto department routing, and civic map.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>View Community Feed</span>
              <ArrowRight size={13} />
            </span>
          </Link>

          {/* Card 3 */}
          <Link
            to="/services"
            className="group bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-5 transition flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Briefcase size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition">
                3. Autonomous Bureaucracy Agent
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Playwright browser automation for solar subsidies and scholarships with explicit citizen approval checkpoints and receipt tracking.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Execute Services</span>
              <ArrowRight size={13} />
            </span>
          </Link>

          {/* Card 4 */}
          <Link
            to="/verify"
            className="group bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl p-5 transition flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/40"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <CheckCheck size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition">
                4. Real-Time Fact & Deepfake Audit
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                PIB Fact Check corroboration, clickable gazette citations, Error Level Analysis (ELA) forensics, and synthetic media detection.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Audit News & Media</span>
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </section>

      {/* Prominent Official Announcements Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Official Government Announcements & Schemes
            </h2>
            <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
              PIB Ingested
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshLivePIB}
              title="Query Live PIB Feed"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Refresh PIB</span>
            </button>
            <Link
              to="/policies"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center space-x-1 text-slate-400">
                    <Building size={13} className="text-slate-500" />
                    <span className="truncate max-w-[200px]">{item.department}</span>
                  </span>
                  <span className="flex items-center space-x-1 font-mono text-[11px]">
                    <Calendar size={12} className="text-slate-500" />
                    <span>{item.publication_date}</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100 leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.localized_summary}
                </p>

                {item.affected_citizens && (
                  <div className="mt-3 inline-flex items-center space-x-1.5 text-[11px] bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60">
                    <Users size={12} className="text-amber-400" />
                    <span>Target: {item.affected_citizens}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveSpeechText(item.localized_summary);
                    setActiveSpeechTitle(item.title);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 bg-amber-950/30 hover:bg-amber-900/40 px-2.5 py-1 rounded-lg border border-amber-900/40 transition"
                >
                  <Volume2 size={13} />
                  <span>Listen in {language}</span>
                </button>

                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <span>Official Gazette Link</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Voice Player Modal / Strip if triggered */}
      {activeSpeechText && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
              <Volume2 size={15} />
              <span>Now Playing Regional Narration: {activeSpeechTitle}</span>
            </span>
            <button
              onClick={() => setActiveSpeechText(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <VoicePlayer text={activeSpeechText} title={activeSpeechTitle} />
        </div>
      )}

      {/* Recent Community Grievances Feed Snippet */}
      {recentGrievances.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100">
                Recent Civic Grievances & Community Triage
              </h2>
            </div>
            <Link
              to="/grievances"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
            >
              <span>Explore All Reports</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentGrievances.map((g) => (
              <div
                key={g.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-[10px] text-slate-400">{g.ticket_number}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        g.status === 'Resolved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-100 line-clamp-1">{g.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{g.description}</p>

                  <div className="mt-3 flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded">{g.category}</span>
                    <span className="text-slate-500">•</span>
                    <span>{g.department}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1 text-amber-400">
                    <span className="font-bold">{g.upvotes_count}</span>
                    <span className="text-[11px] text-slate-400">upvotes</span>
                  </div>
                  <Link
                    to={`/grievances`}
                    className="text-blue-400 hover:text-blue-300 font-semibold text-[11px]"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
