import React from 'react';
import { Link } from 'react-router-dom';
import {
  Languages,
  Eye,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { language, setLanguage, supportedLanguages, highContrast, toggleHighContrast, t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Government Slogan Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold tracking-wide text-amber-400">{t('slogan')}</span>
          <span className="hidden md:inline text-slate-400">— {t('supporting_slogan')}</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300">
          <span className="hidden sm:inline font-mono text-[11px] text-slate-400">Government of India / National Citizen Portal</span>
          <div className="flex items-center space-x-1">
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50">Verified Platform</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-900/30">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <ShieldCheck size={22} className="text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                  CivicConnect
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  AI Gov
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Digital Citizen Governance
              </p>
            </div>
          </Link>
        </div>

        {/* Right Action Controls: Language, High Contrast, Auth */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Selector */}
          <div className="relative flex items-center">
            <Languages size={16} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select regional language"
              className="bg-slate-800 text-slate-200 pl-8 pr-7 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
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
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eye size={15} />
            <span className="hidden lg:inline text-[11px]">A11y</span>
          </button>

          {/* User Auth Controls */}
          {user ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/profile"
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:inline font-semibold">{user.full_name}</span>
                {user.role !== 'citizen' && (
                  <span className="text-[10px] bg-indigo-900/80 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-700">
                    {user.role === 'municipal_officer' ? 'Officer' : 'Admin'}
                  </span>
                )}
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-blue-900/30 transition flex items-center space-x-1"
              >
                <span>{t('register')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
