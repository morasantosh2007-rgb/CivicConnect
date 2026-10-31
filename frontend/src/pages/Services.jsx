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
  const { t } = useLanguage();
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
  }, []);

  const fetchServiceCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const res = await axios.get('/api/v1/services/catalog');
      setCatalog(res.data || []);
      if (res.data?.length > 0) {
        setSelectedService(res.data[0]);
      }
    } catch (err) {
      console.error('Fetch catalog error:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleInitiateAgent = async () => {
    if (!user) {
      alert('Please sign in to execute public service workflows.');
      return;
    }
    if (!selectedService) return;

    setAgentStep('initiating');
    setErrorMessage(null);
    setTelemetryLogs([
      { step: 'agent_start', message: `Initializing Autonomous Bureaucracy Agent for ${selectedService.service_name}...` },
      { step: 'profile_check', message: 'Extracting verified citizen identity attributes and required documents...' },
      { step: 'browser_launch', message: 'Launching Playwright headless session and navigating to official portal...' }
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
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/60 mb-2">
              <Briefcase size={13} />
              <span>Problem Statement 3 — Autonomous Bureaucracy Execution</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('nav_services')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Autonomous Playwright browser agent that navigates complex government portals, populates verified profile attributes, and pauses for explicit citizen consent before submission.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-xs text-slate-300 flex items-center space-x-2">
            <Lock size={16} className="text-amber-400 shrink-0" />
            <span>Human-in-the-Loop: Agent never submits without explicit authorization.</span>
          </div>
        </div>
      </div>

      {/* Services Grid & Execution Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Service Catalog */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
            Supported Official Services
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
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start space-x-3 ${
                  selectedService?.id === service.id
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-800 text-amber-400 shrink-0 mt-0.5">
                  <Briefcase size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xs text-white leading-snug">
                    {service.service_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {service.description}
                  </p>
                  <span className="text-[10px] text-blue-400 font-semibold mt-2 inline-block">
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-blue-400">{selectedService.portal_name}</span>
                  <a
                    href={selectedService.portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 hover:text-white"
                  >
                    <span>View Official Portal</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {selectedService.service_name}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedService.description}
                </p>
              </div>

              {/* Document Readiness Checklist */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <FileCheck2 size={15} className="text-emerald-400" />
                  <span>Document Readiness & Eligibility Verification</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedService.mandatory_documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 bg-slate-900 p-2 rounded-xl border border-slate-800 text-slate-300"
                    >
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
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
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 text-white font-bold text-xs py-3.5 rounded-xl shadow-xl transition flex items-center justify-center space-x-2"
                  >
                    <Sparkles size={16} />
                    <span>Launch Autonomous Playwright Agent</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-500 mt-2">
                    Browser agent will navigate to portal, structure form inputs, and pause for your authorization.
                  </p>
                </div>
              )}

              {agentStep === 'initiating' && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-white">
                    Agent Navigating Official Portal & Synthesizing Form Fields...
                  </p>
                  <div className="text-[11px] font-mono text-slate-400 space-y-1">
                    {telemetryLogs.map((log, lIdx) => (
                      <div key={lIdx}>{log.message}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicit Human Approval Checkpoint Modal / Card */}
              {agentStep === 'awaiting_approval' && draftResult && (
                <div className="bg-amber-950/20 border-2 border-amber-500/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                    <AlertCircle size={18} />
                    <span>Mandatory Citizen Authorization Checkpoint</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    The autonomous browser agent has navigated to <strong>{draftResult.portal_name}</strong> and pre-filled the required details from your verified profile. You must inspect the pre-submission snapshot and grant explicit authorization before final submission.
                  </p>

                  {/* Pre-approval Screenshot from Browser Agent */}
                  {draftResult.pre_approval_screenshot && (
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
                      <img
                        src={draftResult.pre_approval_screenshot}
                        alt="Pre-approval portal preview"
                        className="w-full object-contain max-h-72"
                      />
                    </div>
                  )}

                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <p><strong>Tracking Reference Assigned:</strong> {draftResult.reference_number}</p>
                    <p><strong>Applicant Name:</strong> {draftResult.form_data?.applicant_name || user?.full_name}</p>
                    <p><strong>State / Region:</strong> {draftResult.form_data?.state || profile?.state || 'Verified'}</p>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      onClick={() => handleApproveAndSubmit(true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve & Authorize Final Submission</span>
                    </button>
                    <button
                      onClick={() => handleApproveAndSubmit(false)}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {agentStep === 'submitting' && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">
                    Citizen Consent Cryptographically Verified. Submitting to Government Authority...
                  </p>
                </div>
              )}

              {/* Submission Completed Card */}
              {agentStep === 'submitted' && finalResult && (
                <div className="bg-emerald-950/40 border border-emerald-700/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 size={20} />
                    <span>Application Officially Submitted & Acknowledged!</span>
                  </div>

                  <p className="text-xs text-slate-200">
                    Your application has been received by <strong>{selectedService.portal_name}</strong>.
                    Official acknowledgement tracking receipt generated.
                  </p>

                  {/* Submission Receipt Image */}
                  {finalResult.receipt_url && (
                    <div className="rounded-xl overflow-hidden border border-emerald-800/80 bg-black">
                      <img
                        src={finalResult.receipt_url}
                        alt="Official Receipt"
                        className="w-full object-contain max-h-72"
                      />
                    </div>
                  )}

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <p>
                      <strong>Official Acknowledgement Reference:</strong>{' '}
                      <span className="font-mono text-emerald-400 font-bold">{finalResult.reference_number}</span>
                    </p>
                    <a
                      href={finalResult.official_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline mt-1 inline-flex items-center space-x-1"
                    >
                      <span>Track Directly on Department Portal</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      setAgentStep('idle');
                      setDraftResult(null);
                      setFinalResult(null);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl"
                  >
                    Complete Another Application
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
