import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Volume2,
  Building,
  Calendar,
  ExternalLink,
  Users,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  FileCheck2,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VoicePlayer from '../components/VoicePlayer';

export default function Policies() {
  const { language, t } = useLanguage();
  const { user, profile } = useAuth();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlySchemes, setOnlySchemes] = useState(false);

  // Active voice narration state
  const [activeSpeech, setActiveSpeech] = useState(null);

  // Personalized Eligibility Engine State
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityForm, setEligibilityForm] = useState({
    age: '',
    annual_income: '',
    state: '',
    district: '',
    category: '',
    employment_status: '',
    disability_status: 'None'
  });
  const [eligibilityResults, setEligibilityResults] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, [language, selectedCategory, onlySchemes]);

  // Load profile data into eligibility form if available
  useEffect(() => {
    if (profile) {
      setEligibilityForm({
        age: profile.age || '',
        annual_income: profile.annual_income || '',
        state: profile.state || '',
        district: profile.district || '',
        category: profile.category || '',
        employment_status: profile.employment_status || '',
        disability_status: profile.disability_status || 'None'
      });
    }
  }, [profile]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/policies/?language=${language}&limit=60`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (onlySchemes) url += `&is_scheme=1`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await axios.get(url);
      setPolicies(res.data.items || []);
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPIB = async () => {
    try {
      setLoading(true);
      await axios.post('/api/v1/policies/refresh-live-pib');
      await fetchPolicies();
    } catch (err) {
      console.error('Refresh PIB error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateEligibility = async (e) => {
    e?.preventDefault();
    setEvaluating(true);
    try {
      const payload = {
        age: eligibilityForm.age ? parseInt(eligibilityForm.age) : null,
        annual_income: eligibilityForm.annual_income ? parseFloat(eligibilityForm.annual_income) : null,
        state: eligibilityForm.state || null,
        district: eligibilityForm.district || null,
        category: eligibilityForm.category || null,
        employment_status: eligibilityForm.employment_status || null,
        disability_status: eligibilityForm.disability_status || null
      };
      const res = await axios.post('/api/v1/policies/check-eligibility', payload);
      setEligibilityResults(res.data.results || []);
    } catch (err) {
      console.error('Eligibility check error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const categories = [
    'All Categories',
    'Agriculture & Farmers Welfare',
    'Energy & Sustainability',
    'Healthcare',
    'Education & Scholarships',
    'Skill Development & Livelihood',
    'Official Announcement'
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/60 mb-2">
              <FileText size={13} />
              <span>Problem Statement 1 — Official Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('nav_policies')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Understand legal rights, welfare policies, and government announcements in your regional language. Grounded strictly in official PIB and gazette notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowEligibilityModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-900/30 transition flex items-center space-x-1.5"
            >
              <FileCheck2 size={16} />
              <span>{t('check_eligibility')}</span>
            </button>

            <button
              onClick={handleRefreshPIB}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh PIB</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPolicies()}
              placeholder="Search scheme name, ministry, or benefits..."
              className="w-full bg-slate-800/90 border border-slate-700 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button
              onClick={() => setOnlySchemes(!onlySchemes)}
              className={`text-xs px-3.5 py-2.5 rounded-xl font-semibold border transition whitespace-nowrap ${
                onlySchemes
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Welfare Schemes Only
            </button>
          </div>
        </div>
      </div>

      {/* Voice Player Banner (If Triggered) */}
      {activeSpeech && (
        <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
              <Volume2 size={16} />
              <span>Playing Voice Explanation: {activeSpeech.title}</span>
            </span>
            <button
              onClick={() => setActiveSpeech(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <VoicePlayer text={activeSpeech.text} title={activeSpeech.title} />
        </div>
      )}

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-md transition"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center space-x-1 text-slate-400">
                  <Building size={13} className="text-slate-500" />
                  <span className="truncate max-w-[200px]">{p.department}</span>
                </span>
                <span className="flex items-center space-x-1 font-mono text-[11px]">
                  <Calendar size={12} className="text-slate-500" />
                  <span>{p.publication_date}</span>
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm text-slate-100 leading-snug">
                  {p.title}
                </h3>
                {p.is_scheme === 1 && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                    Scheme
                  </span>
                )}
              </div>

              {/* Localized Plain Language Explanation */}
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                {p.localized_summary}
              </p>

              {p.benefits_description && (
                <div className="mt-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Entitlements & Benefits
                  </span>
                  <p className="text-xs text-slate-200">{p.benefits_description}</p>
                </div>
              )}

              {p.affected_citizens && (
                <div className="mt-3 inline-flex items-center space-x-1.5 text-[11px] bg-slate-800/60 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60">
                  <Users size={12} className="text-amber-400" />
                  <span>Beneficiary Group: {p.affected_citizens}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                onClick={() =>
                  setActiveSpeech({
                    title: p.title,
                    text: p.localized_summary + (p.benefits_description ? ' ' + p.benefits_description : '')
                  })
                }
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 bg-amber-950/30 hover:bg-amber-900/40 px-3 py-1.5 rounded-lg border border-amber-900/40 transition"
              >
                <Volume2 size={13} />
                <span>Listen ({language.toUpperCase()})</span>
              </button>

              <div className="flex items-center space-x-2">
                <a
                  href={p.official_portal_url || p.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition"
                >
                  <span>Official Portal</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Personalized Scheme Eligibility Modal */}
      {showEligibilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                  <FileCheck2 size={20} className="text-amber-400" />
                  <span>Personalized Scheme Eligibility Engine</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compares your verified or declared profile against official statutory rules.
                </p>
              </div>
              <button
                onClick={() => setShowEligibilityModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleEvaluateEligibility} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={eligibilityForm.age}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, age: e.target.value })}
                  placeholder="e.g. 28"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Household Income (₹)</label>
                <input
                  type="number"
                  value={eligibilityForm.annual_income}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, annual_income: e.target.value })}
                  placeholder="e.g. 250000"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State / Union Territory</label>
                <input
                  type="text"
                  value={eligibilityForm.state}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, state: e.target.value })}
                  placeholder="e.g. Telangana, Maharashtra"
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Social Category</label>
                <select
                  value={eligibilityForm.category}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                >
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC (Other Backward Classes)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Employment / Student Status</label>
                <select
                  value={eligibilityForm.employment_status}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, employment_status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                >
                  <option value="">Select Status</option>
                  <option value="student">Student (Pursuing Higher Education)</option>
                  <option value="farmer">Farmer / Cultivator</option>
                  <option value="artisan">Artisan / Traditional Craftsperson</option>
                  <option value="self_employed">Self-employed / Small Business</option>
                  <option value="salaried">Salaried Employee</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={evaluating}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition"
                >
                  {evaluating ? 'Evaluating Statutory Conditions...' : 'Calculate Eligible Schemes'}
                </button>
              </div>
            </form>

            {/* Results Checklist */}
            {eligibilityResults && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">
                    Evaluation Results ({eligibilityResults.length} Schemes Analyzed)
                  </h3>
                  <span className="text-[10px] text-slate-400">Strictly grounded in official criteria</span>
                </div>

                <div className="space-y-3">
                  {eligibilityResults.map((r, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white">{r.scheme_name}</h4>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 shrink-0 ${
                            r.outcome === 'Potentially eligible'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : r.outcome === 'Additional information required'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {r.outcome === 'Potentially eligible' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          <span>{r.outcome}</span>
                        </span>
                      </div>

                      {/* Satisfied checklist */}
                      {r.conditions_satisfied.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-emerald-400">Conditions Satisfied:</span>
                          <ul className="text-xs text-slate-300 space-y-0.5">
                            {r.conditions_satisfied.map((c, cI) => (
                              <li key={cI} className="flex items-center space-x-1.5">
                                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Not satisfied conditions */}
                      {r.conditions_not_satisfied.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-red-400">Conditions Not Met:</span>
                          <ul className="text-xs text-slate-300 space-y-0.5">
                            {r.conditions_not_satisfied.map((c, cI) => (
                              <li key={cI} className="flex items-center space-x-1.5">
                                <XCircle size={12} className="text-red-400 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing info */}
                      {r.missing_information.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-amber-400">Additional Information Needed:</span>
                          <ul className="text-xs text-slate-300 space-y-0.5">
                            {r.missing_information.map((m, mI) => (
                              <li key={mI} className="flex items-center space-x-1.5">
                                <HelpCircle size={12} className="text-amber-400 shrink-0" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Required Documents */}
                      {r.required_documents.length > 0 && (
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                          <span className="font-bold text-slate-200 block mb-1">Required Verification Documents:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {r.required_documents.map((doc, dI) => (
                              <span key={dI} className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-[10px]">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <a
                          href={r.official_source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline flex items-center space-x-1"
                        >
                          <span>Official Rules Gazette</span>
                          <ExternalLink size={11} />
                        </a>

                        {r.official_application_url && (
                          <a
                            href={r.official_application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                          >
                            <span>Apply on Official Portal</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
