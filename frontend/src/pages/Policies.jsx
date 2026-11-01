import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Volume2,
  Building,
  Calendar,
  ExternalLink,
  Users,
  RefreshCw,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VoicePlayer from '../components/VoicePlayer';

export default function Policies() {
  const { language, supportedLanguages, t } = useLanguage();
  const currentLangObj = supportedLanguages?.find(l => l.code === language);
  const { profile } = useAuth();

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

  const getPolicyCategoryLabel = (cat) => {
    switch (cat) {
      case 'All Categories': return t('all_categories');
      case 'Agriculture & Farmers Welfare': return t('cat_agriculture');
      case 'Energy & Sustainability': return t('cat_energy');
      case 'Healthcare': return t('cat_healthcare');
      case 'Education & Scholarships': return t('cat_education');
      case 'Skill Development & Livelihood': return t('cat_skill');
      case 'Official Announcement': return t('cat_official_announcement');
      default: return cat;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls — 100% Fully Localized */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-2">
              <FileText size={13} className="text-blue-700" />
              <span>{t('policies_header_badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2340] tracking-tight">
              {t('nav_policies')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {t('policies_header_desc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowEligibilityModal(true)}
              className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <FileCheck2 size={16} />
              <span>{t('check_eligibility')}</span>
            </button>

            <button
              onClick={handleRefreshPIB}
              className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 transition flex items-center space-x-1.5 shadow-xs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{t('refresh_pib')}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPolicies()}
              placeholder={t('search_policies_placeholder')}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-xs"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{getPolicyCategoryLabel(c)}</option>
              ))}
            </select>

            <button
              onClick={() => setOnlySchemes(!onlySchemes)}
              className={`text-xs px-3.5 py-2.5 rounded-xl font-semibold border transition whitespace-nowrap shadow-xs ${
                onlySchemes
                  ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t('welfare_schemes_only')}
            </button>
          </div>
        </div>
      </div>

      {/* Voice Player Banner (If Triggered) */}
      {activeSpeech && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
              <Volume2 size={16} />
              <span>{t('now_playing')} {activeSpeech.title}</span>
            </span>
            <button
              onClick={() => setActiveSpeech(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              {t('close')}
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
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="flex items-center space-x-1 text-slate-600">
                  <Building size={13} className="text-slate-400" />
                  <span className="truncate max-w-[200px] font-medium">{p.department}</span>
                </span>
                <span className="flex items-center space-x-1 font-mono text-[11px] text-slate-500">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{p.publication_date}</span>
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm text-[#0c2340] leading-snug">
                  {p.title}
                </h3>
                {p.is_scheme === 1 && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    {t('scheme_badge')}
                  </span>
                )}
              </div>

              {/* Localized Plain Language Explanation */}
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                {p.localized_summary}
              </p>

              {p.benefits_description && (
                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    {t('entitlements_benefits')}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{p.benefits_description}</p>
                </div>
              )}

              {p.affected_citizens && (
                <div className="mt-3 inline-flex items-center space-x-1.5 text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Users size={12} className="text-amber-600" />
                  <span>{t('beneficiary_group')} {p.affected_citizens}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() =>
                  setActiveSpeech({
                    title: p.title,
                    text: p.localized_summary + (p.benefits_description ? ' ' + p.benefits_description : '')
                  })
                }
                className="text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
              >
                <Volume2 size={13} />
                <span>{t('listen_in_lang')} {currentLangObj?.native || language.toUpperCase()}</span>
              </button>

              <div className="flex items-center space-x-2">
                <a
                  href={p.official_portal_url || p.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 transition shadow-xs"
                >
                  <span>{t('official_portal_btn')}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Personalized Scheme Eligibility Modal */}
      {showEligibilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-[#0c2340] flex items-center space-x-2">
                  <FileCheck2 size={20} className="text-blue-700" />
                  <span>{t('eligibility_engine_title')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('eligibility_engine_desc')}
                </p>
              </div>
              <button
                onClick={() => setShowEligibilityModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleEvaluateEligibility} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('age_label')}</label>
                <input
                  type="number"
                  value={eligibilityForm.age}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, age: e.target.value })}
                  placeholder="e.g. 28"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('income_label')}</label>
                <input
                  type="number"
                  value={eligibilityForm.annual_income}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, annual_income: e.target.value })}
                  placeholder="e.g. 250000"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('state_label')}</label>
                <input
                  type="text"
                  value={eligibilityForm.state}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, state: e.target.value })}
                  placeholder="e.g. Telangana, Maharashtra"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('category_label')}</label>
                <select
                  value={eligibilityForm.category}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, category: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">{t('select_category')}</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC (Other Backward Classes)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('employment_label')}</label>
                <select
                  value={eligibilityForm.employment_status}
                  onChange={(e) => setEligibilityForm({ ...eligibilityForm, employment_status: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">{t('select_status')}</option>
                  <option value="student">{t('status_student')}</option>
                  <option value="farmer">{t('status_farmer')}</option>
                  <option value="artisan">{t('status_artisan')}</option>
                  <option value="self_employed">{t('status_self_employed')}</option>
                  <option value="salaried">{t('status_salaried')}</option>
                  <option value="unemployed">{t('status_unemployed')}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={evaluating}
                  className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold py-3 rounded-xl shadow-xs transition"
                >
                  {evaluating ? t('evaluating_btn') : t('calc_eligible_btn')}
                </button>
              </div>
            </form>

            {/* Results Checklist */}
            {eligibilityResults && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {t('eval_results_title')} ({eligibilityResults.length} {t('schemes_analyzed')})
                  </h3>
                  <span className="text-[10px] text-slate-500">{t('grounded_official_criteria')}</span>
                </div>

                <div className="space-y-3">
                  {eligibilityResults.map((r, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-[#0c2340]">{r.scheme_name}</h4>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 shrink-0 ${
                            r.outcome === 'Potentially eligible'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : r.outcome === 'Additional information required'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {r.outcome === 'Potentially eligible' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          <span>
                            {r.outcome === 'Potentially eligible'
                              ? t('outcome_potentially_eligible')
                              : r.outcome === 'Additional information required'
                              ? t('outcome_additional_info')
                              : t('outcome_not_eligible')}
                          </span>
                        </span>
                      </div>

                      {/* Satisfied checklist */}
                      {r.conditions_satisfied.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-emerald-800">{t('conditions_satisfied_label')}</span>
                          <ul className="text-xs text-slate-700 space-y-0.5">
                            {r.conditions_satisfied.map((c, cI) => (
                              <li key={cI} className="flex items-center space-x-1.5">
                                <CheckCircle2 size={12} className="text-emerald-700 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Not satisfied conditions */}
                      {r.conditions_not_satisfied.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-red-800">{t('conditions_not_met_label')}</span>
                          <ul className="text-xs text-slate-700 space-y-0.5">
                            {r.conditions_not_satisfied.map((c, cI) => (
                              <li key={cI} className="flex items-center space-x-1.5">
                                <XCircle size={12} className="text-red-600 shrink-0" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Missing info */}
                      {r.missing_information.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-amber-800">{t('additional_info_needed_label')}</span>
                          <ul className="text-xs text-slate-700 space-y-0.5">
                            {r.missing_information.map((m, mI) => (
                              <li key={mI} className="flex items-center space-x-1.5">
                                <HelpCircle size={12} className="text-amber-600 shrink-0" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Required Documents */}
                      {r.required_documents.length > 0 && (
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                          <span className="font-bold text-slate-800 block mb-1">{t('required_docs_label')}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {r.required_documents.map((doc, dI) => (
                              <span key={dI} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] text-slate-800">
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
                          className="text-blue-700 hover:underline flex items-center space-x-1"
                        >
                          <span>{t('rules_gazette_link')}</span>
                          <ExternalLink size={11} />
                        </a>

                        {r.official_application_url && (
                          <a
                            href={r.official_application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs"
                          >
                            <span>{t('apply_portal_btn')}</span>
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
