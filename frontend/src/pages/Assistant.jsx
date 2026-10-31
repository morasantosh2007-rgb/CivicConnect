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
  Sparkles,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Assistant() {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Namaste! I am your Multilingual AI Citizen Assistant. Ask me anything about government schemes, legal rights, grievance filing, or verifying official government notifications.',
      citations: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

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
          text: 'The assistant could not retrieve data from the official repository at this moment. Please try again.',
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
    recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : 'en-IN'));

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
      utterance.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : 'en-IN'));
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white shadow-lg">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>{t('nav_assistant')}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Official RAG Active
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multilingual policy intelligence grounded in official government gazettes and ministry portals.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-900/20'
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/80 shadow-md'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {/* Citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700 space-y-1.5">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span>Official Verified Citations</span>
                    </span>
                    {m.citations.map((c, cIdx) => (
                      <a
                        key={cIdx}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-400 hover:underline flex items-center space-x-1"
                      >
                        <span className="truncate">{c.title} ({c.department})</span>
                        <ExternalLink size={10} className="shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                {m.role === 'assistant' && (
                  <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/40">
                    <button
                      onClick={() => playVoice(m.text)}
                      className="hover:text-amber-400 flex items-center space-x-1 transition"
                    >
                      <Volume2 size={13} />
                      <span>Listen in {language.toUpperCase()}</span>
                    </button>
                    {m.provider && (
                      <span className="font-mono text-[9px] text-slate-500">{m.provider}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 p-3 rounded-2xl border border-slate-800 max-w-sm">
              <Loader2 size={15} className="animate-spin text-amber-400" />
              <span>Grounded retrieval from official policy repository...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
          <button
            onClick={toggleSpeech}
            title={isRecording ? 'Stop voice recording' : 'Speak voice question'}
            className={`p-3 rounded-xl transition ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask in ${language.toUpperCase()} about welfare schemes, grievance steps, or official facts...`}
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-3 rounded-xl transition font-bold"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
