import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCheck,
  Search,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  FileCheck2,
  Clock,
  Share2,
  Eye,
  FileImage,
  Layers,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Verification() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'media'
  const [claimText, setClaimText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [verifying, setVerifying] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/v1/verification/history');
      setHistory(res.data.items || []);
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  const handleVerifyText = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to run fact verification audits.');
      return;
    }
    if (!claimText.trim()) return;

    setVerifying(true);
    setAuditResult(null);
    try {
      const res = await axios.post('/api/v1/verification/verify', {
        claim_text: claimText,
        source_url: sourceUrl || null,
        media_type: 'text'
      });
      setAuditResult({
        type: 'text',
        fact_check: res.data,
        share_token: res.data.share_token
      });
      fetchHistory();
    } catch (err) {
      console.error('Verify text error:', err);
      alert('Verification analysis failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleAuditMedia = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to audit media assets.');
      return;
    }
    if (!mediaFile) {
      alert('Please upload an image, audio, or video file.');
      return;
    }

    setVerifying(true);
    setAuditResult(null);
    try {
      const formPayload = new FormData();
      formPayload.append('media_file', mediaFile);
      if (claimText) formPayload.append('claim_text', claimText);

      const res = await axios.post('/api/v1/verification/audit-media', formPayload);
      setAuditResult({
        type: 'media',
        media_url: res.data.media_url,
        media_type: res.data.media_type,
        forensic_analysis: res.data.forensic_analysis,
        fact_check: res.data.fact_check,
        share_token: res.data.share_token
      });
      fetchHistory();
    } catch (err) {
      console.error('Media audit error:', err);
      alert('Forensic media audit failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleMediaFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const copyShareLink = (token) => {
    const url = `${window.location.origin}/verify?token=${token}`;
    navigator.clipboard.writeText(url);
    alert('Public verification report certificate URL copied to clipboard!');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header — 100% Fully Localized */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
              <CheckCheck size={13} className="text-emerald-700" />
              <span>{t('verify_header_badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2340] tracking-tight">
              {t('nav_verify')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {t('verify_header_desc')}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center space-x-2 max-w-md">
            <Fingerprint size={18} className="text-emerald-700 shrink-0" />
            <span className="font-medium">{t('forensic_guarantee')}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center space-x-2">
          <button
            onClick={() => {
              setActiveTab('text');
              setAuditResult(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-xs ${
              activeTab === 'text'
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {t('tab_verify_claim')}
          </button>
          <button
            onClick={() => {
              setActiveTab('media');
              setAuditResult(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition shadow-xs ${
              activeTab === 'media'
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {t('tab_audit_media')}
          </button>
        </div>
      </div>

      {/* Input Panels */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        {activeTab === 'text' ? (
          <form onSubmit={handleVerifyText} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('claim_label')}
              </label>
              <textarea
                rows={3}
                required
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder={t('claim_placeholder')}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('source_url_label')}
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={t('source_url_placeholder')}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || !claimText.trim()}
              className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold py-3 rounded-xl shadow-xs transition"
            >
              {verifying ? t('verifying_claim_btn') : t('verify_claim_btn')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuditMedia} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('upload_media_label')}
              </label>
              <input
                type="file"
                required
                accept="image/*,audio/*,video/*"
                onChange={handleMediaFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1e3a8a] file:text-white hover:file:bg-blue-800 cursor-pointer"
              />
              {mediaPreview && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 max-h-56 flex items-center justify-center bg-slate-100">
                  <img src={mediaPreview} alt="Upload preview" className="max-h-56 object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('context_label')}
              </label>
              <input
                type="text"
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder={t('context_placeholder')}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || !mediaFile}
              className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold py-3 rounded-xl shadow-xs transition"
            >
              {verifying ? t('running_audit_btn') : t('run_media_audit_btn')}
            </button>
          </form>
        )}
      </div>

      {/* Audit & Verification Results Card */}
      {auditResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {t('cert_title')}
              </span>
              <h2 className="text-lg font-extrabold text-[#0c2340] flex items-center space-x-2">
                <CheckCheck size={20} className="text-emerald-700" />
                <span>{t('cert_subtitle')}</span>
              </h2>
            </div>

            {auditResult.share_token && (
              <button
                onClick={() => copyShareLink(auditResult.share_token)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition self-start sm:self-auto shadow-xs"
              >
                <Share2 size={13} />
                <span>{t('share_public_cert')}</span>
              </button>
            )}
          </div>

          {/* Verdict Banner */}
          {auditResult.fact_check && (
            <div
              className={`p-5 rounded-xl border space-y-2 ${
                auditResult.fact_check.verdict === 'Verified'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : auditResult.fact_check.verdict === 'Contradicted'
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : auditResult.fact_check.verdict === 'Misleading / Missing Context'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold flex items-center space-x-2">
                  {auditResult.fact_check.verdict === 'Verified' && <CheckCircle2 size={20} className="text-emerald-700" />}
                  {auditResult.fact_check.verdict === 'Contradicted' && <XCircle size={20} className="text-red-700" />}
                  {auditResult.fact_check.verdict === 'Misleading / Missing Context' && <AlertTriangle size={20} className="text-amber-700" />}
                  {auditResult.fact_check.verdict === 'Insufficient Evidence' && <HelpCircle size={20} className="text-slate-500" />}
                  <span>{t('verdict_label')} {auditResult.fact_check.verdict}</span>
                </span>
                <span className="text-xs font-mono font-bold bg-white/80 border border-slate-200 px-2.5 py-1 rounded-lg">
                  {t('confidence_label')} {auditResult.fact_check.confidence_score * 100}%
                </span>
              </div>

              <p className="text-xs leading-relaxed pt-1">
                {auditResult.fact_check.explanation}
              </p>
            </div>
          )}

          {/* Media Forensic Audit Visualizer (ELA & Metadata) */}
          {auditResult.forensic_analysis && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <Fingerprint size={16} className="text-blue-700" />
                <span>{t('forensic_inspection_title')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ELA Visualizer */}
                {auditResult.forensic_analysis.ela_visualization_url && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                      {t('ela_title')}
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-300 bg-white">
                      <img
                        src={auditResult.forensic_analysis.ela_visualization_url}
                        alt="ELA Forensic Heatmap"
                        className="w-full object-contain max-h-56"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {t('ela_desc')}
                    </span>
                  </div>
                )}

                {/* Detected Anomalies */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                      {t('manipulation_prob')}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            auditResult.forensic_analysis.manipulation_probability > 0.5 ? 'bg-red-600' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${auditResult.forensic_analysis.manipulation_probability * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {auditResult.forensic_analysis.manipulation_probability * 100}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                      {t('forensic_findings')}
                    </span>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {auditResult.forensic_analysis.anomalies_detected?.map((a, aIdx) => (
                        <li key={aIdx} className="flex items-start space-x-1.5">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    {auditResult.forensic_analysis.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Official Clickable Citations */}
          {auditResult.fact_check?.citations && auditResult.fact_check.citations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {t('official_citations_title')}
              </span>
              <div className="space-y-2">
                {auditResult.fact_check.citations.map((c, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <h4 className="font-bold text-[#0c2340]">{c.source_name}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 italic">"{c.excerpt}"</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Publication Date: {c.publication_date} • {c.relationship_to_claim}
                      </span>
                    </div>
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 shrink-0 self-start sm:self-auto shadow-xs"
                    >
                      <span>{t('direct_source_btn')}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification History Section */}
      {history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
            <Clock size={15} className="text-blue-700" />
            <span>{t('prev_audits_title')}</span>
          </h2>

          <div className="space-y-2.5">
            {history.map((h) => (
              <div
                key={h.id}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase inline-block ${
                      h.verdict === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : h.verdict === 'Contradicted'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {h.verdict}
                  </span>
                  <p className="font-bold text-slate-900 line-clamp-1">{h.claim_text}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{h.explanation}</p>
                </div>

                <button
                  onClick={() => copyShareLink(h.share_token)}
                  className="text-xs text-blue-700 hover:text-blue-900 flex items-center space-x-1 font-semibold shrink-0"
                >
                  <Share2 size={12} />
                  <span>{t('share_cert_btn')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
