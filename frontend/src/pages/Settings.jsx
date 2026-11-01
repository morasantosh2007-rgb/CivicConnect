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
      {/* Header — 100% Fully Localized */}
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
              {t('settings_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-[#0c2340] border-b border-slate-100 pb-3">
          <Languages size={18} className="text-blue-700" />
          <span>{t('regional_lang_title')}</span>
        </div>

        <p className="text-xs text-slate-600">
          {t('regional_lang_desc')}
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
          <span>{t('accessibility_title')}</span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">{t('high_contrast_title')}</span>
              <span className="text-slate-500 text-[11px]">
                {t('high_contrast_desc')}
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
              {highContrast ? t('status_enabled') : t('status_disabled')}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">{t('font_scaling_title')}</span>
              <span className="text-slate-500 text-[11px]">{t('font_scaling_desc')}</span>
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
                  {t('font_' + size.replace('-', '_'))}
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
          <span>{t('dpdp_title')}</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {t('dpdp_desc')}
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-emerald-800">
            <CheckCircle2 size={16} />
            <span>{t('consent_active')}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {t('consent_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
