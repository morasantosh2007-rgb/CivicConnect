import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Languages,
  Eye,
  Type,
  Bell,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { language, setLanguage, supportedLanguages, highContrast, toggleHighContrast, t } = useLanguage();
  const { user } = useAuth();

  const [fontSize, setFontSize] = useState('normal');
  const [notifyUpdates, setNotifyUpdates] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-slate-800 text-amber-400 border border-slate-700">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {t('nav_settings')}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalize language preferences, accessibility, notifications, and privacy options.
            </p>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
          <Languages size={18} className="text-blue-400" />
          <span>Regional Language Configuration</span>
        </div>

        <p className="text-xs text-slate-300">
          Select your primary interface language. Navigation, official legal explainers, form validation, and audio narration will adapt.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {supportedLanguages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                language === l.code
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className="text-sm">{l.native}</span>
              <span className="text-[10px] opacity-80 uppercase tracking-wider">{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
          <Eye size={18} className="text-amber-400" />
          <span>Digital Accessibility & Display (WCAG AAA)</span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div>
              <span className="font-bold text-white block">High Contrast Mode</span>
              <span className="text-slate-400 text-[11px]">
                Increases contrast ratio for enhanced readability in outdoor bright sunlight or low-vision conditions.
              </span>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`px-4 py-2 rounded-xl font-bold transition text-xs ${
                highContrast
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {highContrast ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div>
              <span className="font-bold text-white block">Font Scaling</span>
              <span className="text-slate-400 text-[11px]">Adjust application base typography size.</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {['normal', 'large', 'x-large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] transition ${
                    fontSize === size
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DPDP Act Privacy & Consent */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span>Digital Personal Data Protection (DPDP Act Compliance)</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          CivicConnect complies with the Digital Personal Data Protection Act rules. Your data is strictly utilized for the explicit purpose of government service discovery, grievance routing, and scheme matching.
        </p>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-emerald-400">
            <CheckCircle2 size={16} />
            <span>Consent Timestamp Active</span>
          </div>
          <p className="text-[11px] text-slate-400">
            You may update or delete your profile attributes at any time from the My Profile page. Document metadata retrieved via DigiLocker is revocable on demand.
          </p>
        </div>
      </div>
    </div>
  );
}
