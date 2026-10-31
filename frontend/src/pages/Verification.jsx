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
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 mb-2">
              <CheckCheck size={13} />
              <span>Problem Statement 4 — Forensic Truth Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('nav_verify')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Verify viral news, government scheme rumors, deepfake videos, altered photographs, and synthetic audio recordings. Grounded in official PIB Fact Check archives.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-xs text-slate-300 flex items-center space-x-2">
            <Fingerprint size={18} className="text-emerald-400 shrink-0" />
            <span>Forensic ELA, EXIF metadata inspection, and official gazette corroboration.</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center space-x-2">
          <button
            onClick={() => {
              setActiveTab('text');
              setAuditResult(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
              activeTab === 'text'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Verify News / Policy Claim
          </button>
          <button
            onClick={() => {
              setActiveTab('media');
              setAuditResult(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
              activeTab === 'media'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Deepfake & Forensic Media Audit
          </button>
        </div>
      </div>

      {/* Input Panels */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {activeTab === 'text' ? (
          <form onSubmit={handleVerifyText} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter Suspicious Claim, Viral Message, or Policy Statement
              </label>
              <textarea
                rows={3}
                required
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="e.g. Government is distributing ₹5,000 to all citizens under new solar initiative..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Source News URL / Social Media Link (Optional)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://news-portal.com/claim-article"
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || !claimText.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition"
            >
              {verifying ? 'Querying PIB Fact Check & Gazette Archives...' : 'Verify Claim Against Official Sources'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuditMedia} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Upload Suspicious Image, Video, or Audio Asset
              </label>
              <input
                type="file"
                required
                accept="image/*,audio/*,video/*"
                onChange={handleMediaFileChange}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
              {mediaPreview && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-700 max-h-56 flex items-center justify-center bg-black">
                  <img src={mediaPreview} alt="Upload preview" className="max-h-56 object-contain" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Claim Context / Accompanying Caption
              </label>
              <input
                type="text"
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="e.g. Official photo claiming to show bridge inauguration collapse..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || !mediaFile}
              className="w-full bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition"
            >
              {verifying ? 'Running Error Level Analysis (ELA) & Metadata Forensics...' : 'Run Deepfake & Forensic Media Audit'}
            </button>
          </form>
        )}
      </div>

      {/* Audit & Verification Results Card */}
      {auditResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Official Verification Report
              </span>
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <CheckCheck size={20} className="text-emerald-400" />
                <span>Verification Certificate & Forensic Analysis</span>
              </h2>
            </div>

            {auditResult.share_token && (
              <button
                onClick={() => copyShareLink(auditResult.share_token)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition self-start sm:self-auto"
              >
                <Share2 size={13} />
                <span>Share Public Certificate</span>
              </button>
            )}
          </div>

          {/* Verdict Banner */}
          {auditResult.fact_check && (
            <div
              className={`p-5 rounded-2xl border space-y-2 ${
                auditResult.fact_check.verdict === 'Verified'
                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                  : auditResult.fact_check.verdict === 'Contradicted'
                  ? 'bg-red-950/50 border-red-800 text-red-200'
                  : auditResult.fact_check.verdict === 'Misleading / Missing Context'
                  ? 'bg-amber-950/50 border-amber-800 text-amber-200'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold flex items-center space-x-2">
                  {auditResult.fact_check.verdict === 'Verified' && <CheckCircle2 size={20} className="text-emerald-400" />}
                  {auditResult.fact_check.verdict === 'Contradicted' && <XCircle size={20} className="text-red-400" />}
                  {auditResult.fact_check.verdict === 'Misleading / Missing Context' && <AlertTriangle size={20} className="text-amber-400" />}
                  {auditResult.fact_check.verdict === 'Insufficient Evidence' && <HelpCircle size={20} className="text-slate-400" />}
                  <span>Verdict: {auditResult.fact_check.verdict}</span>
                </span>
                <span className="text-xs font-mono font-bold bg-slate-900/60 px-2.5 py-1 rounded-lg">
                  Confidence: {auditResult.fact_check.confidence_score * 100}%
                </span>
              </div>

              <p className="text-xs leading-relaxed text-slate-200 pt-1">
                {auditResult.fact_check.explanation}
              </p>
            </div>
          )}

          {/* Media Forensic Audit Visualizer (ELA & Metadata) */}
          {auditResult.forensic_analysis && (
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Fingerprint size={16} />
                <span>Forensic Multimedia Inspection Output</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ELA Visualizer */}
                {auditResult.forensic_analysis.ela_visualization_url && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Error Level Analysis (ELA) Compression Map:
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
                      <img
                        src={auditResult.forensic_analysis.ela_visualization_url}
                        alt="ELA Forensic Heatmap"
                        className="w-full object-contain max-h-56"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Bright highlighted clusters indicate localized digital re-saving or spliced editing.
                    </span>
                  </div>
                )}

                {/* Detected Anomalies */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Manipulation Probability Score:
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            auditResult.forensic_analysis.manipulation_probability > 0.5 ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${auditResult.forensic_analysis.manipulation_probability * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {auditResult.forensic_analysis.manipulation_probability * 100}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Forensic Findings:
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {auditResult.forensic_analysis.anomalies_detected?.map((a, aIdx) => (
                        <li key={aIdx} className="flex items-start space-x-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
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
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Official Corroborating Government Citations
              </span>
              <div className="space-y-2">
                {auditResult.fact_check.citations.map((c, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <h4 className="font-bold text-white">{c.source_name}</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 italic">"{c.excerpt}"</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Publication Date: {c.publication_date} • {c.relationship_to_claim}
                      </span>
                    </div>
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 shrink-0 self-start sm:self-auto"
                    >
                      <span>Direct Official Source</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Clock size={15} className="text-blue-400" />
            <span>Your Previous Fact Verification Audits</span>
          </h2>

          <div className="space-y-2.5">
            {history.map((h) => (
              <div
                key={h.id}
                className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase inline-block ${
                      h.verdict === 'Verified'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : h.verdict === 'Contradicted'
                        ? 'bg-red-950 text-red-300 border-red-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {h.verdict}
                  </span>
                  <p className="font-bold text-slate-200 line-clamp-1">{h.claim_text}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{h.explanation}</p>
                </div>

                <button
                  onClick={() => copyShareLink(h.share_token)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-semibold shrink-0"
                >
                  <Share2 size={12} />
                  <span>Share Certificate</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
