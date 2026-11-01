import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FloatingAssistant from './components/FloatingAssistant';

import Home from './pages/Home';
import Policies from './pages/Policies';
import Services from './pages/Services';
import Grievances from './pages/Grievances';
import Verification from './pages/Verification';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children, officerOnly = false }) {
  const { user, loading, isOfficerOrAdmin } = useAuth();
  const { t } = useLanguage();
  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">{t('loading_session')}</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (officerOnly && !isOfficerOrAdmin()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/services" element={<Services />} />
            <Route path="/grievances" element={<Grievances />} />
            <Route path="/verify" element={<Verification />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute officerOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <FloatingAssistant />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <MainLayout />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
