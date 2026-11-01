import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  FileCheck2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
  Languages,
  Info,
  Lock
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { language } = useLanguage();
  const { user, profile, updateProfile } = useAuth();

  const [digilockerStatus, setDigilockerStatus] = useState(null);
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    state: '',
    district: '',
    annual_income: '',
    education: 'Graduate',
    employment_status: 'salaried',
    category: 'General',
    disability_status: 'None',
    occupation: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchDigilockerStatus();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age || '',
        gender: profile.gender || 'Male',
        state: profile.state || '',
        district: profile.district || '',
        annual_income: profile.annual_income || '',
        education: profile.education || 'Graduate',
        employment_status: profile.employment_status || 'salaried',
        category: profile.category || 'General',
        disability_status: profile.disability_status || 'None',
        occupation: profile.occupation || ''
      });
    }
  }, [profile]);

  const fetchDigilockerStatus = async () => {
    try {
      const res = await axios.get('/api/v1/digilocker/status');
      setDigilockerStatus(res.data);
    } catch (err) {
      console.error('DigiLocker status error:', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        state: formData.state,
        district: formData.district,
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
        education: formData.education,
        employment_status: formData.employment_status,
        category: formData.category,
        disability_status: formData.disability_status,
        occupation: formData.occupation
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectDigilocker = async () => {
    try {
      const res = await axios.get('/api/v1/digilocker/authorize-url');
      if (res.data.success) {
        window.location.href = res.data.authorization_url;
      } else {
        alert(res.data.error || 'DigiLocker client credentials awaiting official partner onboarding.');
      }
    } catch (err) {
      console.error('DigiLocker auth error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header — Government White Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0c2340] flex items-center justify-center text-white text-xl font-bold shadow-xs">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0c2340]">{user?.full_name}</h1>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200 uppercase">
                  {user?.role}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                  Preferred Language: {language.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Honest DigiLocker Integration Status Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck size={20} className="text-blue-700" />
            <h2 className="text-base font-bold text-[#0c2340]">DigiLocker Integration Adapter</h2>
          </div>
          <span className="text-[10px] font-mono bg-blue-50 text-blue-800 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
            {digilockerStatus?.status || 'Active Adapter'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {digilockerStatus?.message}
        </p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-800 block">MeitY Partner Onboarding Information</span>
            <p className="text-slate-500 text-[11px]">
              Production Requester access requires organization agreement with Digital India Corporation.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="https://partners.digitallocker.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1 shadow-xs"
            >
              <span>Partner Specs</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={handleConnectDigilocker}
              className="bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              Connect DigiLocker
            </button>
          </div>
        </div>
      </div>

      {/* Manual Profile Entry Alternative */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0c2340] flex items-center space-x-2">
              <FileCheck2 size={18} className="text-blue-700" />
              <span>Citizen Eligibility Profile Attributes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These verified or declared attributes power your personalized scheme matching across all state and central policies.
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
              <CheckCircle2 size={14} />
              <span>Saved Successfully!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 29"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other / Third Gender</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State / Union Territory</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="e.g. Telangana, Uttar Pradesh, Tamil Nadu"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="e.g. Hyderabad, Lucknow, Chennai"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Family Income (₹)</label>
            <input
              type="number"
              value={formData.annual_income}
              onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
              placeholder="e.g. 240000"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Social Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="General">General</option>
              <option value="OBC">OBC (Other Backward Classes)</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="EWS">EWS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Employment / Occupation</label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="e.g. Farmer, Electrician, Student, Software Engineer"
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Disability Status</label>
            <select
              value={formData.disability_status}
              onChange={(e) => setFormData({ ...formData, disability_status: e.target.value })}
              className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="None">None / General</option>
              <option value="Locomotor">Locomotor Disability (40%+)</option>
              <option value="Visual">Visual Impairment (40%+)</option>
              <option value="Hearing">Hearing Impairment (40%+)</option>
            </select>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <Save size={15} />
              <span>{saving ? 'Saving Profile...' : 'Save Profile & Update Scheme Matcher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
