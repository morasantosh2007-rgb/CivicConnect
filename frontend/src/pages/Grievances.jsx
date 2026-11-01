import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Mic,
  MicOff,
  CheckCircle2,
  Building,
  Sparkles,
  Camera,
  Send
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Grievances() {
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  // Submission Drawer State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Potholes',
    latitude: '',
    longitude: '',
    address: '',
    landmark: '',
    is_official_complaint: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Audio Voice Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  // Submission AI Feedback State
  const [submissionResult, setSubmissionResult] = useState(null);

  // Comments State
  const [activeCommentsGrievanceId, setActiveCommentsGrievanceId] = useState(null);
  const [commentsData, setCommentsData] = useState({});
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    fetchGrievances();
  }, [sortBy, selectedCategory]);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/grievances/?sort_by=${sortBy}&limit=50`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await axios.get(url);
      setGrievances(res.data.items || []);
    } catch (err) {
      console.error('Error fetching grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (grievanceId) => {
    if (!user) {
      alert(t('alert_signin_upvote'));
      return;
    }
    try {
      const res = await axios.post(`/api/v1/grievances/${grievanceId}/vote`);
      setGrievances((prev) =>
        prev.map((g) =>
          g.id === grievanceId
            ? { ...g, upvotes_count: res.data.upvotes_count, has_user_upvoted: res.data.upvoted }
            : g
        )
      );
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert(t('alert_geo_unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          address: prev.address || 'GPS Coordinates Auto-Captured'
        }));
      },
      (err) => {
        console.error('Geo error:', err);
        alert(t('alert_geo_failed'));
      }
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert(t('alert_mic_failed'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitGrievance = async (e) => {
    e.preventDefault();
    if (!user) {
      alert(t('alert_signin_grievance'));
      return;
    }
    setSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      formPayload.append('category', formData.category);
      if (formData.latitude) formPayload.append('latitude', formData.latitude);
      if (formData.longitude) formPayload.append('longitude', formData.longitude);
      if (formData.address) formPayload.append('address', formData.address);
      if (formData.landmark) formPayload.append('landmark', formData.landmark);
      formPayload.append('is_official_complaint', formData.is_official_complaint);

      if (imageFile) {
        formPayload.append('image', imageFile);
      }
      if (audioBlob) {
        formPayload.append('audio', audioBlob, 'grievance_voice.wav');
      }

      const res = await axios.post('/api/v1/grievances/', formPayload);
      setSubmissionResult(res.data);
      fetchGrievances();
    } catch (err) {
      console.error('Submission error:', err);
      alert(t('alert_submit_grievance_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComments = async (grievanceId) => {
    if (activeCommentsGrievanceId === grievanceId) {
      setActiveCommentsGrievanceId(null);
      return;
    }
    setActiveCommentsGrievanceId(grievanceId);
    try {
      const res = await axios.get(`/api/v1/grievances/${grievanceId}`);
      setCommentsData((prev) => ({ ...prev, [grievanceId]: res.data.comments || [] }));
    } catch (err) {
      console.error('Fetch comments error:', err);
    }
  };

  const handlePostComment = async (grievanceId) => {
    if (!newCommentText.trim()) return;
    if (!user) {
      alert(t('alert_signin_comment'));
      return;
    }
    try {
      const res = await axios.post(`/api/v1/grievances/${grievanceId}/comments`, {
        content: newCommentText
      });
      setCommentsData((prev) => ({
        ...prev,
        [grievanceId]: [...(prev[grievanceId] || []), res.data]
      }));
      setNewCommentText('');
    } catch (err) {
      console.error('Post comment error:', err);
    }
  };

  const categories = [
    'Potholes',
    'Road cracks',
    'Damaged roads',
    'Water leakage',
    'Waterlogging',
    'Drainage problems',
    'Garbage accumulation',
    'Overflowing dustbins',
    'Broken streetlights',
    'Damaged bridges',
    'Open manholes',
    'Fallen trees',
    'Electrical hazards',
    'Other infrastructure'
  ];

  const getGrievanceCategoryLabel = (cat) => {
    switch (cat) {
      case 'Potholes': return t('cat_potholes');
      case 'Road cracks': return t('cat_road_cracks');
      case 'Damaged roads': return t('cat_damaged_roads');
      case 'Water leakage': return t('cat_water_leakage');
      case 'Waterlogging': return t('cat_waterlogging');
      case 'Drainage problems': return t('cat_drainage');
      case 'Garbage accumulation': return t('cat_garbage');
      case 'Overflowing dustbins': return t('cat_dustbins');
      case 'Broken streetlights': return t('cat_streetlights');
      case 'Damaged bridges': return t('cat_bridges');
      case 'Open manholes': return t('cat_manholes');
      case 'Fallen trees': return t('cat_fallen_trees');
      case 'Electrical hazards': return t('cat_electrical');
      case 'Other infrastructure': return t('cat_other_infra');
      default: return cat;
    }
  };

  const getGrievanceDeptLabel = (dept) => {
    if (!dept) return '';
    const d = dept.toLowerCase();
    if (d.includes('road') || d.includes('public works') || d.includes('pwd')) return t('dept_pwd');
    if (d.includes('water') || d.includes('sewerage')) return t('dept_water');
    if (d.includes('sanitation') || d.includes('waste')) return t('dept_sanitation');
    if (d.includes('drainage') || d.includes('flood')) return t('dept_drainage');
    if (d.includes('electric') || d.includes('lighting')) return t('dept_electric');
    if (d.includes('forest') || d.includes('park')) return t('dept_parks');
    return dept;
  };

  const getGrievanceStatusLabel = (status) => {
    switch (status) {
      case 'Submitted': return t('status_submitted');
      case 'AI Analyzed': return t('status_ai_analyzed');
      case 'Department Suggested': return t('status_dept_suggested');
      case 'Assigned': return t('status_assigned');
      case 'Acknowledged': return t('status_acknowledged');
      case 'In Progress': return t('status_in_progress');
      case 'Resolution Submitted': return t('status_res_submitted');
      case 'Resolved': return t('status_resolved');
      case 'Rejected': return t('status_rejected');
      default: return status;
    }
  };

  const getGrievanceSeverityLabel = (sev) => {
    switch (sev) {
      case 'Critical': return t('sev_critical');
      case 'High': return t('sev_high');
      case 'Medium': return t('sev_medium');
      case 'Low': return t('sev_low');
      default: return sev;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls — 100% Fully Localized */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mb-2">
              <AlertTriangle size={13} className="text-amber-700" />
              <span>{t('grievances_header_badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0c2340] tracking-tight">
              {t('nav_grievances')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {t('grievances_header_desc')}
            </p>
          </div>

          <button
            onClick={() => {
              setSubmissionResult(null);
              setShowSubmitModal(true);
            }}
            className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-xs transition flex items-center space-x-2"
          >
            <Camera size={16} />
            <span>{t('report_problem_btn')}</span>
          </button>
        </div>

        {/* Filters and Sorting */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('sort_label')}</span>
            {[
              { id: 'latest', label: t('sort_latest') },
              { id: 'top_voted', label: t('sort_top_voted') },
              { id: 'severity', label: t('sort_severity') }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold border transition shadow-xs ${
                  sortBy === s.id
                    ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="">{t('all_categories')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>{getGrievanceCategoryLabel(c)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Community Grievance Feed */}
      <div className="space-y-4">
        {grievances.map((g) => (
          <div
            key={g.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs transition"
          >
            <div className="p-5 flex items-start space-x-4">
              {/* Upvote Column */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => handleVote(g.id)}
                  className={`p-1.5 rounded-lg transition ${
                    g.has_user_upvoted
                      ? 'text-amber-600 bg-amber-100 font-bold'
                      : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                  }`}
                  title={t('upvote_action')}
                >
                  <ThumbsUp size={18} />
                </button>
                <span className="text-xs font-bold text-slate-800 mt-1">{g.upvotes_count}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-tighter">{t('upvotes_label')}</span>
              </div>

              {/* Main Content Body */}
              <div className="flex-1 space-y-3">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200">
                      {g.ticket_number}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-800">{g.author_name}</span>
                    <span>•</span>
                    <span>{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Severity Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        g.severity === 'Critical'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : g.severity === 'High'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {getGrievanceSeverityLabel(g.severity)}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        g.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {getGrievanceStatusLabel(g.status)}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-[#0c2340]">{g.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                    {g.description}
                  </p>
                </div>

                {/* Media: Image with CV Bounding Box Visualization */}
                {g.image_url && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-96 w-full flex items-center justify-center">
                    <img
                      src={g.image_url}
                      alt={g.title}
                      className="max-h-96 object-contain rounded-xl"
                    />
                    {g.cv_analysis && g.cv_analysis.detected_classes?.length > 0 && (
                      <div className="absolute top-2 left-2 bg-white/95 shadow-sm px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-amber-800 font-semibold flex items-center space-x-1.5">
                        <Sparkles size={11} className="text-amber-600" />
                        <span>{t('cv_detected_label')} {g.cv_analysis.detected_classes.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Voice recording playback if available */}
                {g.audio_url && (
                  <div className="mt-2">
                    <audio controls src={g.audio_url} className="w-full h-8" />
                  </div>
                )}

                {/* Location & Department Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                    <Building size={12} className="text-blue-700" />
                    <span>{getGrievanceDeptLabel(g.department)}</span>
                  </span>

                  {g.address && (
                    <span className="inline-flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                      <MapPin size={12} className="text-amber-600" />
                      <span className="truncate max-w-xs">{g.address}</span>
                    </span>
                  )}

                  {g.duplicate_of_id && (
                    <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 text-[10px] font-semibold">
                      {t('linked_proximity')}
                    </span>
                  )}
                </div>

                {/* Action Bar (Comments toggle) */}
                <div className="pt-3 border-t border-slate-100 flex items-center space-x-4">
                  <button
                    onClick={() => toggleComments(g.id)}
                    className="text-xs text-slate-600 hover:text-blue-700 flex items-center space-x-1.5 transition font-medium"
                  >
                    <MessageSquare size={14} />
                    <span>{g.comment_count || 0} {t('comments_count_label')}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {activeCommentsGrievanceId === g.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div className="space-y-2">
                      {(commentsData[g.id] || []).map((c) => (
                        <div key={c.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                            <span className="font-bold text-slate-800">{c.author_name}</span>
                            <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-700">{c.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment(g.id)}
                        placeholder={t('add_comment_placeholder')}
                        className="flex-1 bg-white border border-slate-300 text-xs text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        onClick={() => handlePostComment(g.id)}
                        className="bg-[#1e3a8a] hover:bg-blue-800 text-white p-2 rounded-xl text-xs font-semibold shadow-xs"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-[#0c2340] flex items-center space-x-2">
                  <Camera size={18} className="text-blue-700" />
                  <span>{t('report_modal_title')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('report_modal_desc')}
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Submission Feedback View if Completed */}
            {submissionResult ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 size={18} />
                    <span>{t('registered_success_title')}</span>
                  </div>
                  <p>
                    {t('ticket_ref')} <strong>{submissionResult.grievance.ticket_number}</strong>
                  </p>
                  <p>
                    {t('routed_to')} <strong>{getGrievanceDeptLabel(submissionResult.ai_analysis.routed_department)}</strong>
                  </p>
                  <p>
                    {t('ai_recommended_severity')} <strong>{getGrievanceSeverityLabel(submissionResult.ai_analysis.suggested_severity)}</strong> (Confidence: {submissionResult.ai_analysis.severity_confidence * 100}%)
                  </p>
                  <p className="text-slate-600 italic">
                    "{submissionResult.ai_analysis.severity_rationale}"
                  </p>

                  {submissionResult.ai_analysis.duplicate_candidate && (
                    <div className="mt-3 bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
                      <span className="font-bold block mb-1">{t('proximity_alert_title')}</span>
                      <span>
                        {t('proximity_alert_desc')}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
                >
                  {t('return_to_feed')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitGrievance} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('subject_label')}</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('subject_placeholder')}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t('infra_category_label')}</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{getGrievanceCategoryLabel(c)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t('location_coords_label')}</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2.5 rounded-xl flex items-center space-x-1 shrink-0"
                      >
                        <MapPin size={14} className="text-amber-600" />
                        <span>{t('detect_gps')}</span>
                      </button>
                      <input
                        type="text"
                        placeholder={t('address_placeholder')}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('detailed_desc_label')}</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('detailed_desc_placeholder')}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl p-3 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Voice Note Recording Section */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                      <Mic size={14} className="text-blue-700" />
                      <span>{t('record_voice_label')}</span>
                    </span>
                    {isRecording && (
                      <span className="text-red-600 text-xs font-mono font-bold animate-pulse">
                        ● {t('recording_pulse')} {recordingTime}s
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 flex items-center space-x-1.5 shadow-xs"
                      >
                        <Mic size={14} />
                        <span>{t('start_voice_btn')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5"
                      >
                        <MicOff size={14} />
                        <span>{t('stop_voice_btn')}</span>
                      </button>
                    )}

                    {audioUrl && (
                      <div className="flex-1">
                        <audio controls src={audioUrl} className="w-full h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo Upload with CV Preview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t('upload_evidence_label')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1e3a8a] file:text-white hover:file:bg-blue-800"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-slate-100">
                      <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white text-xs font-bold py-3 rounded-xl shadow-xs transition"
                  >
                    {submitting ? t('submitting_grievance_btn') : t('submit_grievance_btn')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
