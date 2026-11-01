import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  AlertTriangle,
  Briefcase,
  CheckCheck,
  ArrowRight,
  Volume2,
  Calendar,
  Building,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
  Users,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import VoicePlayer from '../components/VoicePlayer';

export default function Home() {
  const { language, supportedLanguages, t } = useLanguage();
  const currentLangObj = supportedLanguages?.find(l => l.code === language);
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
      {/* Hero Section — 100% Fully Translated */}
      <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold text-blue-800 mb-4">
            <ShieldCheck size={14} className="text-blue-700" />
            <span>{t('hero_badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0c2340] tracking-tight leading-tight">
            {t('slogan')}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {t('supporting_slogan')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
            <Link
              to="/policies"
              className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-sm transition flex items-center space-x-2"
            >
              <FileText size={18} />
              <span>{t('check_eligibility')}</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/grievances"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center space-x-2 shadow-xs"
            >
              <AlertTriangle size={18} className="text-amber-600" />
              <span>{t('submit_grievance')}</span>
            </Link>

            <Link
              to="/verify"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center space-x-2"
            >
              <CheckCheck size={18} className="text-emerald-700" />
              <span>{t('verify_claims')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Public Accountability Metrics Banner */}
      {analytics && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span>{t('accountability_title')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('accountability_desc')}
              </p>
            </div>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {t('resolution_rate')}: <strong className="text-emerald-700 font-bold">{analytics.resolution_rate_percent}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">{t('total_grievances')}</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analytics.total_grievances}</p>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <span className="text-xs font-medium text-amber-800">{t('pending_triaged')}</span>
              <p className="text-2xl font-bold text-amber-700 mt-1">{analytics.pending_triaged}</p>
            </div>
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
              <span className="text-xs font-medium text-blue-800">{t('in_active_progress')}</span>
              <p className="text-2xl font-bold text-blue-700 mt-1">{analytics.in_progress}</p>
            </div>
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs font-medium text-emerald-800">{t('successfully_resolved')}</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{analytics.resolved}</p>
            </div>
          </div>
        </section>
      )}

      {/* Interconnected Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t('ecosystem_title')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('ecosystem_desc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Module 1 */}
          <Link
            to="/policies"
            className="group bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 transition flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4 group-hover:scale-105 transition-transform">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                {t('card1_title')}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {t('card1_desc')}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-blue-700 group-hover:translate-x-1 transition-transform">
              <span>{t('card1_action')}</span>
              <ArrowRight size={13} />
            </span>
          </Link>

          {/* Module 2 */}
          <Link
            to="/grievances"
            className="group bg-white border border-slate-200 hover:border-amber-500 rounded-2xl p-5 transition flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 group-hover:scale-105 transition-transform">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition">
                {t('card2_title')}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {t('card2_desc')}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 group-hover:translate-x-1 transition-transform">
              <span>{t('card2_action')}</span>
              <ArrowRight size={13} />
            </span>
          </Link>

          {/* Module 3 */}
          <Link
            to="/services"
            className="group bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 transition flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4 group-hover:scale-105 transition-transform">
                <Briefcase size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition">
                {t('card3_title')}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {t('card3_desc')}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-indigo-700 group-hover:translate-x-1 transition-transform">
              <span>{t('card3_action')}</span>
              <ArrowRight size={13} />
            </span>
          </Link>

          {/* Module 4 */}
          <Link
            to="/verify"
            className="group bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 transition flex flex-col justify-between shadow-xs hover:shadow-md"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4 group-hover:scale-105 transition-transform">
                <CheckCheck size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                {t('card4_title')}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {t('card4_desc')}
              </p>
            </div>
            <span className="mt-4 inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
              <span>{t('card4_action')}</span>
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </section>

      {/* Official Announcements Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">
              {t('announcements_title')}
            </h2>
            <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-200">
              {t('pib_ingested')}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshLivePIB}
              title="Query Live PIB Feed"
              className="text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 flex items-center space-x-1 transition shadow-xs"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">{t('refresh_pib')}</span>
            </button>
            <Link
              to="/policies"
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1"
            >
              <span>{t('view_all')}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="flex items-center space-x-1 text-slate-600">
                    <Building size={13} className="text-slate-400" />
                    <span className="truncate max-w-[200px] font-medium">{item.department}</span>
                  </span>
                  <span className="flex items-center space-x-1 font-mono text-[11px] text-slate-500">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{item.publication_date}</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {item.localized_summary}
                </p>

                {item.affected_citizens && (
                  <div className="mt-3 inline-flex items-center space-x-1.5 text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                    <Users size={12} className="text-amber-600" />
                    <span>{t('target_label')}: {item.affected_citizens}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveSpeechText(item.localized_summary);
                    setActiveSpeechTitle(item.title);
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                >
                  <Volume2 size={13} />
                  <span>{t('listen_in_lang')} {currentLangObj?.native || language.toUpperCase()}</span>
                </button>

                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1"
                >
                  <span>{t('official_gazette_link')}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voice Player Modal / Strip */}
      {activeSpeechText && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
              <Volume2 size={15} />
              <span>{t('now_playing')} {activeSpeechTitle}</span>
            </span>
            <button
              onClick={() => setActiveSpeechText(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              {t('close')}
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
              <AlertTriangle size={18} className="text-amber-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {t('recent_grievances_title')}
              </h2>
            </div>
            <Link
              to="/grievances"
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1"
            >
              <span>{t('explore_all_reports')}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentGrievances.map((g) => (
              <div
                key={g.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-[10px] text-slate-500">{g.ticket_number}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        g.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {g.status === 'Resolved'
                        ? t('status_resolved')
                        : g.status === 'In Progress'
                        ? t('status_in_progress')
                        : g.status === 'Submitted'
                        ? t('status_submitted')
                        : g.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{g.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{g.description}</p>

                  <div className="mt-3 flex items-center space-x-2 text-[10px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{g.category}</span>
                    <span className="text-slate-400">•</span>
                    <span>{g.department}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1 text-amber-700 font-semibold">
                    <span>{g.upvotes_count}</span>
                    <span className="text-[11px] text-slate-500 font-normal">{t('upvotes_label')}</span>
                  </div>
                  <Link
                    to={`/grievances`}
                    className="text-blue-700 hover:text-blue-900 font-semibold text-[11px]"
                  >
                    {t('view_details')}
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
