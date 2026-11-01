import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Briefcase,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Eye,
  Clock,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  Loader2,
  FileCheck2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Services() {
  const { language, t } = useLanguage();
  const { user, profile } = useAuth();

  const [catalog, setCatalog] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [customInputs, setCustomInputs] = useState({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Agent Automation Execution State
  const [agentStep, setAgentStep] = useState('idle'); // idle, initiating, awaiting_approval, submitting, submitted
  const [draftResult, setDraftResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchServiceCatalog();
  }, [language]);

  const fetchServiceCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const res = await axios.get(`/api/v1/services/catalog?language=${language}`);
      setCatalog(res.data || []);
      if (res.data?.length > 0) {
        setSelectedService(prev => {
          if (!prev) return res.data[0];
          return res.data.find(s => s.id === prev.id) || res.data[0];
        });
      }
    } catch (err) {
      console.error('Fetch catalog error:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleInitiateAgent = async () => {
    if (!user) {
      alert(t('alert_signin_services'));
      return;
    }
    if (!selectedService) return;

    setAgentStep('initiating');
    setErrorMessage(null);
    setTelemetryLogs([
      { step: 'agent_start', message: `Initializing Autonomous Bureaucracy Agent for ${selectedService.service_name}...` },
      { step: 'profile_check', message: 'Extracting verified citizen identity attributes and required documents...' },
      { step: 'browser_launch', message: 'Launching Playwright session and navigating to official portal...' }
    ]);

    try {
      const res = await axios.post('/api/v1/services/initiate', {
        service_id: selectedService.id,
        service_name: selectedService.service_name,
        portal_name: selectedService.portal_name,
        custom_inputs: customInputs
      });

      setDraftResult(res.data);
      setTelemetryLogs(res.data.telemetry || []);
      setAgentStep('awaiting_approval');
    } catch (err) {
      console.error('Agent initiation error:', err);
      setErrorMessage(err.response?.data?.detail || 'Agent could not initiate browser session.');
      setAgentStep('idle');
    }
  };

  const handleApproveAndSubmit = async (approved) => {
    if (!draftResult) return;

    if (!approved) {
      try {
        await axios.post('/api/v1/services/approve', {
          application_id: draftResult.application_id,
          approved: false
        });
      } catch (err) {}
      setAgentStep('idle');
      setDraftResult(null);
      return;
    }

    setAgentStep('submitting');
    try {
      const res = await axios.post('/api/v1/services/approve', {
        application_id: draftResult.application_id,
        approved: true
      });
      setFinalResult(res.data);
      setTelemetryLogs(res.data.telemetry || []);
      setAgentStep('submitted');
    } catch (err) {
      console.error('Approval submission error:', err);
      setErrorMessage(err.response?.data?.detail || 'Error finalizing official submission.');
      setAgentStep('awaiting_approval');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header — 100% Fully Localized */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 mb-2">
              <Briefcase size={13} className="text-indigo-700" />
              <span>{t('services_header_badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2340] tracking-tight">
              {t('nav_services')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {t('services_header_desc')}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center space-x-2 max-w-md">
            <Lock size={16} className="text-blue-700 shrink-0" />
            <span className="font-medium">{t('human_loop_guarantee')}</span>
          </div>
        </div>
      </div>

      {/* Services Grid & Execution Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Service Catalog */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            {t('supported_services_title')}
          </h2>

          <div className="space-y-2.5">
            {catalog.map((service) => (
              <div
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setAgentStep('idle');
                  setDraftResult(null);
                  setFinalResult(null);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-start space-x-3 shadow-xs ${
                  selectedService?.id === service.id
                    ? 'bg-blue-50/70 border-blue-600 text-blue-950 font-medium'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800 shrink-0 mt-0.5">
                  <Briefcase size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xs text-[#0c2340] leading-snug">
                    {service.service_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {service.description}
                  </p>
                  <span className="text-[10px] text-blue-700 font-semibold mt-2 inline-block">
                    {service.portal_name} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Columns: Active Service Details & Execution Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedService && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-blue-700">{selectedService.portal_name}</span>
                  <a
                    href={selectedService.portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 hover:text-blue-900 font-medium"
                  >
                    <span>{t('view_official_portal')}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <h2 className="text-xl font-extrabold text-[#0c2340]">
                  {selectedService.service_name}
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedService.description}
                </p>
              </div>

              {/* Document Readiness Checklist */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <FileCheck2 size={15} className="text-emerald-700" />
                  <span>{t('doc_readiness_title')}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedService.mandatory_documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 shadow-xs"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Trigger / State Management */}
              {agentStep === 'idle' && (
                <div className="pt-2">
                  <button
                    onClick={handleInitiateAgent}
                    className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs py-3.5 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                  >
                    <Sparkles size={16} />
                    <span>{t('launch_agent_btn')}</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-500 mt-2">
                    {t('launch_agent_desc')}
                  </p>
                </div>
              )}

              {agentStep === 'initiating' && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-blue-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-900">
                    {t('agent_navigating')}
                  </p>
                  <div className="text-[11px] font-mono text-slate-600 space-y-1">
                    {telemetryLogs.map((log, lIdx) => (
                      <div key={lIdx}>{log.message}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicit Human Approval Checkpoint Modal / Card */}
              {agentStep === 'awaiting_approval' && draftResult && (
                <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                    <AlertCircle size={18} className="text-amber-700" />
                    <span>{t('checkpoint_title')}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {t('checkpoint_desc')}
                  </p>

                  {/* Pre-approval Screenshot from Browser Agent */}
                  {draftResult.pre_approval_screenshot && (
                    <div className="rounded-xl overflow-hidden border border-slate-300 bg-white">
                      <img
                        src={draftResult.pre_approval_screenshot}
                        alt="Pre-approval portal preview"
                        className="w-full object-contain max-h-72"
                      />
                    </div>
                  )}

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <p><strong>{t('assigned_ref')}</strong> {draftResult.reference_number}</p>
                    <p><strong>{t('applicant_name')}</strong> {draftResult.form_data?.applicant_name || user?.full_name}</p>
                    <p><strong>{t('state_region')}</strong> {draftResult.form_data?.state || profile?.state || 'Verified'}</p>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => handleApproveAndSubmit(true)}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 size={15} />
                      <span>{t('approve_authorize_btn')}</span>
                    </button>
                    <button
                      onClick={() => handleApproveAndSubmit(false)}
                      className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      {t('cancel_btn')}
                    </button>
                  </div>
                </div>
              )}

              {agentStep === 'submitting' && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-emerald-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-900">
                    {t('submitting_to_gov')}
                  </p>
                </div>
              )}

              {/* Submission Completed Card */}
              {agentStep === 'submitted' && finalResult && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 size={20} className="text-emerald-700" />
                    <span>{t('app_submitted_title')}</span>
                  </div>

                  <p className="text-xs text-slate-700">
                    {t('app_submitted_desc')}
                  </p>

                  {/* Submission Receipt Image */}
                  {finalResult.receipt_url && (
                    <div className="rounded-xl overflow-hidden border border-emerald-300 bg-white">
                      <img
                        src={finalResult.receipt_url}
                        alt="Official Receipt"
                        className="w-full object-contain max-h-72"
                      />
                    </div>
                  )}

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <p>
                      <strong>{t('official_ack_ref')}</strong>{' '}
                      <span className="font-mono text-emerald-700 font-bold">{finalResult.reference_number}</span>
                    </p>
                    <a
                      href={finalResult.official_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline mt-1 inline-flex items-center space-x-1 font-semibold"
                    >
                      <span>{t('track_portal_link')}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      setAgentStep('idle');
                      setDraftResult(null);
                      setFinalResult(null);
                    }}
                    className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
                  >
                    {t('complete_another_btn')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
