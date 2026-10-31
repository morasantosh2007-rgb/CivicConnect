import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Volume2, Play, Pause, RotateCcw, FastForward, Square, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VoicePlayer({ text, audioUrl: initialAudioUrl, title = 'Audio Narration' }) {
  const { language } = useLanguage();
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    setAudioUrl(initialAudioUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [initialAudioUrl, text, language]);

  const fetchAudioIfMissing = async () => {
    if (audioUrl) return audioUrl;
    if (!text) return null;

    setLoading(true);
    try {
      const res = await axios.post('/api/v1/policies/speak', {
        text: text.slice(0, 800), // optimal speech chunk
        language: language
      });
      const url = res.data.audio_url;
      setAudioUrl(url);
      return url;
    } catch (err) {
      console.error('Audio synthesis error:', err);
      // Fallback: browser speech synthesis if backend is busy
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
        utterance.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : 'en-IN'));
        utterance.rate = playbackRate;
        window.speechSynthesis.speak(utterance);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async () => {
    let url = audioUrl;
    if (!url) {
      url = await fetchAudioIfMissing();
    }
    if (url && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error('Audio play error:', err));
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlaybackRate = () => {
    const nextRate = playbackRate === 1.0 ? 1.25 : (playbackRate === 1.25 ? 1.5 : 1.0);
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-md">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Volume2 size={16} className="text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">{title}</span>
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono uppercase">
            {language}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-blue-500 h-full transition-all duration-100"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              <span>Play</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Pause size={14} />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleStop}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            title="Stop"
          >
            <Square size={14} />
          </button>

          <button
            onClick={handleReplay}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            title="Replay"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <button
          onClick={togglePlaybackRate}
          className="text-[11px] font-bold font-mono bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition flex items-center space-x-1"
        >
          <FastForward size={12} />
          <span>{playbackRate}x</span>
        </button>
      </div>
    </div>
  );
}
