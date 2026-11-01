import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Assistant() {
  const { language, supportedLanguages, t } = useLanguage();
  const currentLangObj = supportedLanguages?.find(l => l.code === language);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize or update welcome greeting according to selected language
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: t('assistant_welcome'),
        citations: []
      }
    ]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/v1/assistant/chat', {
        message: q,
        language: language
      });
      const aiMsg = {
        role: 'assistant',
        text: res.data.answer,
        citations: res.data.citations || [],
        grounded: res.data.grounded,
        provider: res.data.provider
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: t('retrieval_loading'),
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeech = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : (language === 'kn' ? 'kn-IN' : 'en-IN')));

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setInput(text);
        setIsRecording(false);
        handleSend(text);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
    } else {
      setIsRecording(false);
      recognition.stop();
    }
  };

  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 400));
      utterance.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : (language === 'kn' ? 'kn-IN' : 'en-IN')));
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header — 100% Fully Localized */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-800">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0c2340] flex items-center space-x-2">
              <span>{t('nav_assistant')}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
                {t('rag_active')}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('assistant_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/70">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.role === 'user'
                    ? 'bg-[#1e3a8a] text-white rounded-br-none'
                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 size={12} className="text-emerald-700" />
                      <span>{t('official_citations')}</span>
                    </span>
                    {m.citations.map((c, cIdx) => (
                      <a
                        key={cIdx}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-700 hover:underline flex items-center space-x-1"
                      >
                        <span className="truncate">{c.title} ({c.department})</span>
                        <ExternalLink size={10} className="shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                {m.role === 'assistant' && (
                  <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                    <button
                      onClick={() => playVoice(m.text)}
                      className="hover:text-blue-800 flex items-center space-x-1 transition font-medium"
                    >
                      <Volume2 size={13} />
                      <span>{t('listen_in_lang')} {currentLangObj?.native || language.toUpperCase()}</span>
                    </button>
                    {m.provider && (
                      <span className="font-mono text-[9px] text-slate-400">{m.provider}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-200 max-w-sm shadow-xs">
              <Loader2 size={15} className="animate-spin text-blue-700" />
              <span>{t('retrieval_loading')}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-2">
          <button
            onClick={toggleSpeech}
            title={isRecording ? 'Stop voice recording' : 'Speak voice question'}
            className={`p-3 rounded-xl transition ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('assistant_placeholder')}
            className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-40 text-white p-3 rounded-xl transition font-bold shadow-xs"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
