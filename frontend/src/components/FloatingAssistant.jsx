import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  ExternalLink,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FloatingAssistant() {
  const { language, supportedLanguages, t } = useLanguage();
  const currentLangObj = supportedLanguages?.find(l => l.code === language);
  const [isOpen, setIsOpen] = useState(false);
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
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
      console.error('Assistant chat error:', err);
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

  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert(t('alert_speech_unsupported'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : (language === 'kn' ? 'kn-IN' : 'en-IN')));
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
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
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#1e3a8a] hover:bg-blue-800 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg flex items-center space-x-2.5 transition transform hover:scale-105 border border-blue-400 group"
          aria-label="Open AI Citizen Assistant"
        >
          <div className="relative">
            <Bot size={22} className="text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1e3a8a] animate-pulse"></span>
          </div>
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            {t('nav_assistant')}
          </span>
        </button>
      )}

      {/* Assistant Modal Drawer */}
      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#0c2340] p-4 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-900 border border-blue-700 text-amber-300">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center space-x-1.5">
                  <span>{t('nav_assistant')}</span>
                  <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-semibold">
                    {t('rag_active')}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  {t('assistant_subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-blue-950 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Guidance Prompts */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 shrink-0 font-medium">{t('quick_prompts_title')}</span>
            {[
              t('prompt_solar'),
              t('prompt_pothole'),
              t('prompt_scholarship'),
              t('prompt_factcheck')
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200 transition shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-[#1e3a8a] text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Citations if available */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
                        <CheckCircle2 size={11} className="text-emerald-700" />
                        <span>{t('official_citations')}</span>
                      </p>
                      {m.citations.map((c, cIdx) => (
                        <a
                          key={cIdx}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[10px] text-blue-700 hover:text-blue-900 hover:underline flex items-center space-x-1"
                        >
                          <span className="truncate">{c.title}</span>
                          <ExternalLink size={9} className="shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Speech playback trigger for AI response */}
                  {m.role === 'assistant' && (
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => playVoice(m.text)}
                        className="hover:text-blue-800 flex items-center space-x-1 transition font-medium"
                      >
                        <Volume2 size={12} />
                        <span>{t('listen_in_lang')} {currentLangObj?.native || language.toUpperCase()}</span>
                      </button>
                      {m.provider && (
                        <span className="font-mono text-[9px] text-slate-400">
                          {m.provider}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 max-w-[75%] shadow-xs">
                <Loader2 size={14} className="animate-spin text-blue-700" />
                <span>{t('retrieval_loading')}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <button
              onClick={toggleSpeechRecognition}
              title={isRecording ? t('speech_stop_recording') : t('speech_start_recording')}
              className={`p-2 rounded-xl transition ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('assistant_placeholder')}
              className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-xs"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
