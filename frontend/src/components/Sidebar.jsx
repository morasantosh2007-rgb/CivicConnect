import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  AlertTriangle,
  CheckCheck,
  Bot,
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
  const { isOfficerOrAdmin } = useAuth();

  const navItems = [
    { to: '/', label: t('nav_home'), icon: LayoutDashboard },
    { to: '/policies', label: t('nav_policies'), icon: FileText, badge: 'Official' },
    { to: '/services', label: t('nav_services'), icon: Briefcase, badge: 'Agent' },
    { to: '/grievances', label: t('nav_grievances'), icon: AlertTriangle, badge: 'Live Feed' },
    { to: '/verify', label: t('nav_verify'), icon: CheckCheck, badge: 'Forensic' },
    { to: '/assistant', label: t('nav_assistant'), icon: Bot, highlight: true },
    { to: '/profile', label: t('nav_profile'), icon: UserCheck },
    { to: '/settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 md:top-20 z-50 md:z-30 h-screen md:h-[calc(100vh-5rem)] w-72 bg-white border-r border-slate-200 shadow-sm flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between md:hidden pb-4 mb-4 border-b border-slate-200">
            <span className="font-bold text-sm text-slate-800">Navigation Menu</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-2">
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
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-700 shadow-sm'
                        : item.highlight
                        ? 'text-blue-800 bg-blue-50/70 border border-blue-200 hover:bg-blue-100/60'
                        : 'text-slate-700 hover:text-blue-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} className="shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Officer & Admin Portal (Visible to authorized roles) */}
            {isOfficerOrAdmin() && (
              <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 px-3 pb-2 flex items-center justify-between">
                  <span>Administrative Control</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">Authorized</span>
                </div>
                <NavLink
                  to="/admin"
                  onClick={() => {
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-100 text-amber-900 font-bold border-l-4 border-amber-600'
                        : 'text-amber-800 bg-amber-50/60 border border-amber-200 hover:bg-amber-100'
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
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-800">Grounded in Official Sources</p>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              PIB Releases • myScheme • National Portals • Open Gov Data
            </p>
            <a
              href="https://india.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-[10px] text-blue-700 hover:text-blue-900 flex items-center space-x-1 font-semibold"
            >
              <span>india.gov.in (National Portal)</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
