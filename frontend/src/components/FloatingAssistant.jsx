import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FloatingAssistant() {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Namaste! I am your Multilingual AI Citizen Assistant. How can I assist you with government schemes, grievance filing, or verifying official news today?',
      citations: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

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
          text: 'The assistant is connecting with official government data repositories. Please try again or query specific schemes like PM-Kisan or PM Surya Ghar.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : 'en-IN'));
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

      recognition.onerror = (e) => {
        console.error('Speech recognition error:', e);
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
      utterance.lang = language === 'hi' ? 'hi-IN' : (language === 'te' ? 'te-IN' : (language === 'ta' ? 'ta-IN' : 'en-IN'));
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-500 hover:from-blue-600 hover:to-amber-400 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center space-x-2.5 transition transform hover:scale-105 border border-amber-300/30 group"
          aria-label="Open AI Citizen Assistant"
        >
          <div className="relative">
            <Bot size={22} className="text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></span>
          </div>
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            {t('nav_assistant')}
          </span>
        </button>
      )}

      {/* Assistant Modal Drawer */}
      {isOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-4 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30">
                <Bot size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center space-x-1.5">
                  <span>Civic AI Assistant</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Multilingual Citizen Rights & Grievance Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Guidance Prompts */}
          <div className="bg-slate-950/60 px-3 py-2 border-b border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-500 shrink-0 font-medium">Quick:</span>
            {[
              'PM Surya Ghar eligibility',
              'Report deep road pothole',
              'Check scholarship rules',
              'Verify official PIB news'
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-700 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-900/20'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/80'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Citations if available */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/80 space-y-1">
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                        <CheckCircle2 size={11} className="text-emerald-400" />
                        <span>Official Citations & Sources</span>
                      </p>
                      {m.citations.map((c, cIdx) => (
                        <a
                          key={cIdx}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1"
                        >
                          <span className="truncate">{c.title}</span>
                          <ExternalLink size={9} className="shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Speech playback trigger for AI response */}
                  {m.role === 'assistant' && (
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <button
                        onClick={() => playVoice(m.text)}
                        className="hover:text-amber-400 flex items-center space-x-1 transition"
                      >
                        <Volume2 size={12} />
                        <span>Listen in {language}</span>
                      </button>
                      {m.provider && (
                        <span className="font-mono text-[9px] text-slate-500">
                          {m.provider}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 max-w-[70%]">
                <Loader2 size={14} className="animate-spin text-amber-400" />
                <span>Consulting official government repository...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <button
              onClick={toggleSpeechRecognition}
              title={isRecording ? 'Stop speech recognition' : 'Speak your question'}
              className={`p-2 rounded-xl transition ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about schemes, grievances, or facts..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
