import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { register } = useAuth();
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'citizen',
    department: 'Public Works & Roads Department',
    preferred_language: language,
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.role !== 'citizen' ? formData.department : null,
        preferred_language: formData.preferred_language,
        phone: formData.phone || null
      });
      setLanguage(formData.preferred_language);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || t('error_registration_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0c2340] mx-auto flex items-center justify-center text-white shadow-xs">
            <ShieldCheck size={26} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0c2340] tracking-tight">
            {t('register_title')}
          </h1>
          <p className="text-xs text-slate-500">
            {t('register_subtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('fullname_label')}</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t('fullname_placeholder')}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('email_label')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('email_placeholder')}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('password_label')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('password_placeholder')}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Language Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {t('preferred_language')}
              </label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Account Role */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('role_label')}</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
              >
                <option value="citizen">{t('citizen_role')}</option>
                <option value="municipal_officer">{t('officer_role')}</option>
                <option value="department_admin">{t('admin_role')}</option>
                <option value="platform_admin">{t('platform_admin_role')}</option>
              </select>
            </div>
          </div>

          {formData.role !== 'citizen' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('department_label')}</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
              >
                <option value="Public Works & Roads Department">{t('dept_pwd')}</option>
                <option value="Municipal Water Supply & Sewerage Board">{t('dept_water')}</option>
                <option value="Sanitation & Solid Waste Management">{t('dept_sanitation')}</option>
                <option value="Stormwater Drainage & Flood Control">{t('dept_drainage')}</option>
                <option value="Electrical & Public Lighting Authority">{t('dept_electric')}</option>
                <option value="Urban Forestry & Parks Division">{t('dept_parks')}</option>
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? t('creating_account') : t('complete_registration')}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>{t('already_registered')} </span>
          <Link to="/login" className="text-blue-700 hover:text-blue-900 font-semibold">
            {t('login')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
