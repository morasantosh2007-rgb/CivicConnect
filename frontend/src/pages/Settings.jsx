import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Languages,
  Eye,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { language, setLanguage, supportedLanguages, highContrast, toggleHighContrast, t } = useLanguage();
  const { user } = useAuth();

  const [fontSize, setFontSize] = useState('normal');

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header — Government White Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0c2340] tracking-tight">
              {t('nav_settings')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize language preferences, accessibility, notifications, and privacy options.
            </p>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-[#0c2340] border-b border-slate-100 pb-3">
          <Languages size={18} className="text-blue-700" />
          <span>Regional Language Configuration</span>
        </div>

        <p className="text-xs text-slate-600">
          Select your primary interface language. Navigation, official legal explainers, form validation, and audio narration will adapt immediately.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {supportedLanguages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 shadow-xs ${
                language === l.code
                  ? 'bg-blue-50 text-blue-900 border-blue-600 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm">{l.native}</span>
              <span className="text-[10px] opacity-70 uppercase tracking-wider">{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-[#0c2340] border-b border-slate-100 pb-3">
          <Eye size={18} className="text-blue-700" />
          <span>Digital Accessibility & Display (WCAG AAA)</span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">High Contrast Mode</span>
              <span className="text-slate-500 text-[11px]">
                Increases contrast ratio for enhanced readability in outdoor bright sunlight or low-vision conditions.
              </span>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`px-4 py-2 rounded-xl font-bold transition text-xs shadow-xs ${
                highContrast
                  ? 'bg-blue-800 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              {highContrast ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Font Scaling</span>
              <span className="text-slate-500 text-[11px]">Adjust application base typography size.</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {['normal', 'large', 'x-large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] transition shadow-xs ${
                    fontSize === size
                      ? 'bg-[#1e3a8a] text-white font-bold'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-[#0c2340] border-b border-slate-100 pb-3">
          <ShieldCheck size={18} className="text-emerald-700" />
          <span>Digital Personal Data Protection (DPDP Act Compliance)</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          CivicConnect complies with the Digital Personal Data Protection Act rules. Your data is strictly utilized for the explicit purpose of government service discovery, grievance routing, and scheme matching.
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-emerald-800">
            <CheckCircle2 size={16} />
            <span>Consent Timestamp Active</span>
          </div>
          <p className="text-[11px] text-slate-500">
            You may update or delete your profile attributes at any time from the My Profile page. Document metadata retrieved via DigiLocker is revocable on demand.
          </p>
        </div>
      </div>
    </div>
  );
}
