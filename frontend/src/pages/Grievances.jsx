import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Mic,
  MicOff,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Send,
  Building,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  Eye,
  Camera,
  Play,
  Pause,
  Layers,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Grievances() {
  const { language, t } = useLanguage();
  const { user } = useAuth();

  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest'); // latest, top_voted, severity
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
      alert('Please sign in to support this report.');
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

  // Geolocation Auto-Detect
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
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
        alert('Could not retrieve GPS coordinates. Please enter location manually.');
      }
    );
  };

  // Browser Audio Recording (MediaRecorder)
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
      alert('Unable to access microphone. Please check browser permissions.');
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
      alert('Please sign in to file an official grievance.');
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
      alert('Failed to submit grievance. Please verify fields and try again.');
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
      alert('Please sign in to join community discussion.');
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

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/60 mb-2">
              <AlertTriangle size={13} />
              <span>Problem Statement 2 — Transparent Community Triage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('nav_grievances')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Community-driven civic issue feed with real-time computer vision analysis, multimodal severity triage, and automated departmental routing.
            </p>
          </div>

          <button
            onClick={() => {
              setSubmissionResult(null);
              setShowSubmitModal(true);
            }}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center space-x-2"
          >
            <Camera size={16} />
            <span>Report Civic Problem</span>
          </button>
        </div>

        {/* Filters and Sorting (Reddit Style) */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Sort:</span>
            {[
              { id: 'latest', label: 'Latest Reports' },
              { id: 'top_voted', label: 'Most Supported' },
              { id: 'severity', label: 'Critical Severity' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                  sortBy === s.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
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
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Community Grievance Feed (Reddit Style) */}
      <div className="space-y-4">
        {grievances.map((g) => (
          <div
            key={g.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-md transition"
          >
            <div className="p-5 flex items-start space-x-4">
              {/* Upvote Column */}
              <div className="flex flex-col items-center justify-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 shrink-0">
                <button
                  onClick={() => handleVote(g.id)}
                  className={`p-1.5 rounded-lg transition ${
                    g.has_user_upvoted
                      ? 'text-amber-400 bg-amber-950/60'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                  }`}
                  title="Upvote / Support this report"
                >
                  <ThumbsUp size={18} />
                </button>
                <span className="text-xs font-bold text-slate-200 mt-1">{g.upvotes_count}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-tighter">votes</span>
              </div>

              {/* Main Content Body */}
              <div className="flex-1 space-y-3">
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                    <span className="font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                      {g.ticket_number}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-300">{g.author_name}</span>
                    <span>•</span>
                    <span>{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Severity Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        g.severity === 'Critical'
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : g.severity === 'High'
                          ? 'bg-orange-950 text-orange-300 border-orange-800'
                          : g.severity === 'Medium'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {g.severity}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        g.status === 'Resolved'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-blue-950 text-blue-300 border-blue-800'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-white">{g.title}</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line">
                    {g.description}
                  </p>
                </div>

                {/* Media: Image with CV Bounding Box Visualization */}
                {g.image_url && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-96 w-full flex items-center justify-center">
                    <img
                      src={g.image_url}
                      alt={g.title}
                      className="max-h-96 object-contain rounded-xl"
                    />
                    {g.cv_analysis && g.cv_analysis.detected_classes?.length > 0 && (
                      <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] text-amber-300 flex items-center space-x-1.5">
                        <Sparkles size={11} className="text-amber-400" />
                        <span>CV Detected: {g.cv_analysis.detected_classes.join(', ')}</span>
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
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-400">
                  <span className="inline-flex items-center space-x-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                    <Building size={12} className="text-blue-400" />
                    <span>{g.department}</span>
                  </span>

                  {g.address && (
                    <span className="inline-flex items-center space-x-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                      <MapPin size={12} className="text-amber-400" />
                      <span className="truncate max-w-xs">{g.address}</span>
                    </span>
                  )}

                  {g.duplicate_of_id && (
                    <span className="bg-amber-950/50 text-amber-300 px-2 py-0.5 rounded border border-amber-800 text-[10px]">
                      Linked Proximity Report
                    </span>
                  )}
                </div>

                {/* Action Bar (Comments toggle) */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-4">
                  <button
                    onClick={() => toggleComments(g.id)}
                    className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 transition"
                  >
                    <MessageSquare size={14} />
                    <span>{g.comment_count || 0} Comments</span>
                  </button>
                </div>

                {/* Comments Section */}
                {activeCommentsGrievanceId === g.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <div className="space-y-2">
                      {(commentsData[g.id] || []).map((c) => (
                        <div key={c.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                            <span className="font-bold text-slate-300">{c.author_name}</span>
                            <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-200">{c.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment(g.id)}
                        placeholder="Add community comment or verification update..."
                        className="flex-1 bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handlePostComment(g.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl text-xs font-semibold"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Camera size={18} className="text-amber-400" />
                  <span>Report Civic Infrastructure Problem</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Attach photo, voice description, and GPS coordinates for automated AI triage.
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Submission Feedback View if Completed */}
            {submissionResult ? (
              <div className="space-y-4">
                <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl text-xs text-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-sm text-emerald-400">
                    <CheckCircle2 size={18} />
                    <span>Grievance Successfully Registered!</span>
                  </div>
                  <p>
                    Ticket Ref: <strong>{submissionResult.grievance.ticket_number}</strong>
                  </p>
                  <p>
                    Automatically Routed To: <strong>{submissionResult.ai_analysis.routed_department}</strong>
                  </p>
                  <p>
                    AI Recommended Severity: <strong>{submissionResult.ai_analysis.suggested_severity}</strong> (Confidence: {submissionResult.ai_analysis.severity_confidence * 100}%)
                  </p>
                  <p className="text-slate-300 italic">
                    "{submissionResult.ai_analysis.severity_rationale}"
                  </p>

                  {submissionResult.ai_analysis.duplicate_candidate && (
                    <div className="mt-3 bg-amber-950/60 p-3 rounded-xl border border-amber-800 text-amber-200">
                      <span className="font-bold block mb-1">Proximity Alert:</span>
                      <span>
                        A similar grievance ({submissionResult.ai_analysis.duplicate_candidate.ticket_number}) was detected {submissionResult.ai_analysis.duplicate_candidate.distance_meters} meters away. Your report has been linked to bolster departmental priority!
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl"
                >
                  Return to Civic Feed
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitGrievance} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Title / Brief Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Deep pothole causing accidents near Metro Pillar 42"
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Infrastructure Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location Coordinates</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl flex items-center space-x-1 shrink-0"
                      >
                        <MapPin size={14} />
                        <span>Detect GPS</span>
                      </button>
                      <input
                        type="text"
                        placeholder="Address / Area"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the severity, when it started, and risk to pedestrians or motorists..."
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-3"
                  />
                </div>

                {/* Voice Note Recording Section */}
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Mic size={14} className="text-amber-400" />
                      <span>Record Regional Voice Description (Optional)</span>
                    </span>
                    {isRecording && (
                      <span className="text-red-400 text-xs font-mono animate-pulse">
                        ● Recording {recordingTime}s
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center space-x-1.5"
                      >
                        <Mic size={14} />
                        <span>Start Voice Note</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5"
                      >
                        <MicOff size={14} />
                        <span>Stop & Save Recording</span>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Photo / Evidence</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700 max-h-48 flex items-center justify-center bg-black">
                      <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition"
                  >
                    {submitting ? 'Running CV Inference & Routing...' : 'Submit Official Grievance'}
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
