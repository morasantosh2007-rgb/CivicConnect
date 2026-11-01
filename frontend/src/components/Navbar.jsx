import React from 'react';
import { Link } from 'react-router-dom';
import {
  Languages,
  Eye,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { language, setLanguage, supportedLanguages, highContrast, toggleHighContrast, t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 shadow-sm border-b border-slate-200">
      {/* Indian National Tri-Color Accent Line */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-orange-500"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-emerald-600"></div>
      </div>

      {/* Top Government Slogan Banner */}
      <div className="bg-slate-900 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-amber-400">{t('slogan')}</span>
          <span className="hidden md:inline text-slate-400">— {t('supporting_slogan')}</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300">
          <span className="hidden sm:inline font-sans text-[11px] text-slate-300 font-medium">
            {t('national_portal')}
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
            {t('verified_platform')}
          </span>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="bg-[#0c2340] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle navigation menu"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-white to-emerald-500 p-0.5 shadow-md">
                <div className="w-full h-full bg-[#0c2340] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck size={22} className="text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-bold tracking-tight text-white">
                    {t('app_name')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-mono">
                    Gov.in
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium hidden sm:block">
                  {t('hero_badge')}
                </p>
              </div>
            </Link>
          </div>

          {/* Right Action Controls: Language, High Contrast, Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Selector */}
            <div className="relative flex items-center">
              <Languages size={15} className="absolute left-2.5 text-slate-300 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select regional language"
                className="bg-slate-800 text-white pl-8 pr-7 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer shadow-sm"
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* High Contrast Accessibility Toggle */}
            <button
              onClick={toggleHighContrast}
              title={highContrast ? 'Disable High Contrast' : 'Enable High Contrast Mode'}
              className={`p-2 rounded-lg border text-xs flex items-center space-x-1 transition ${
                highContrast
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Eye size={15} />
              <span className="hidden lg:inline text-[11px]">{t('high_contrast_title')}</span>
            </button>

            {/* User Auth Controls */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline font-semibold">{user.full_name}</span>
                  {user.role !== 'citizen' && (
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                      {user.role === 'municipal_officer' ? t('officer_badge') : t('admin_badge')}
                    </span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition"
                >
                  <span>{t('register')}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
