import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  AlertTriangle,
  MapPin,
  CheckCheck,
  Bot,
  FolderClock,
  UserCheck,
  ShieldAlert,
  Settings,
  X,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { user, isOfficerOrAdmin } = useAuth();

  const navItems = [
    { to: '/', label: t('nav_home'), icon: LayoutDashboard },
    { to: '/policies', label: t('nav_policies'), icon: FileText, badge: 'Official' },
    { to: '/services', label: t('nav_services'), icon: Briefcase, badge: 'Agent' },
    { to: '/grievances', label: t('nav_grievances'), icon: AlertTriangle, badge: 'Live Feed' },
    { to: '/map', label: t('nav_map'), icon: MapPin },
    { to: '/verify', label: t('nav_verify'), icon: CheckCheck, badge: 'Forensic' },
    { to: '/assistant', label: t('nav_assistant'), icon: Bot, highlight: true },
    { to: '/applications', label: t('nav_applications'), icon: FolderClock },
    { to: '/profile', label: t('nav_profile'), icon: UserCheck },
    { to: '/settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 md:top-20 z-50 md:z-30 h-screen md:h-[calc(100vh-5rem)] w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between md:hidden pb-4 mb-4 border-b border-slate-800">
            <span className="font-bold text-sm text-slate-200">Navigation Menu</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
              Citizen Governance
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                        : item.highlight
                        ? 'text-amber-400 bg-amber-950/30 border border-amber-800/40 hover:bg-amber-900/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Officer & Admin Portal (Visible to authorized roles) */}
            {isOfficerOrAdmin() && (
              <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-3 pb-2 flex items-center justify-between">
                  <span>Administrative Control</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 px-1 rounded">Authorized</span>
                </div>
                <NavLink
                  to="/admin"
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-amber-300 bg-amber-950/20 border border-amber-900/40 hover:bg-slate-800'
                    }`
                  }
                >
                  <ShieldAlert size={18} />
                  <span>{t('nav_admin')}</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Footer Slogan & Official Portal Reference */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <p className="text-[11px] font-bold text-slate-200">Grounded in Official Sources</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              PIB Releases • myScheme • National Portals • Open Gov Data
            </p>
            <a
              href="https://india.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-semibold"
            >
              <span>india.gov.in</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
