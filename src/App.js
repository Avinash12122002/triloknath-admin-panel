import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import EditLead from './pages/EditLead';
import Consultations from './pages/Consultations';
import ConsultationDetail from './pages/ConsultationDetail';
import EditConsultation from './pages/EditConsultation';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/leads" element={
              <ProtectedRoute><Leads /></ProtectedRoute>
            } />
            <Route path="/leads/:id" element={
              <ProtectedRoute><LeadDetail /></ProtectedRoute>
            } />
            <Route path="/leads/:id/edit" element={
              <ProtectedRoute><EditLead /></ProtectedRoute>
            } />

            <Route path="/consultations" element={
              <ProtectedRoute><Consultations /></ProtectedRoute>
            } />
            <Route path="/consultations/:id" element={
              <ProtectedRoute><ConsultationDetail /></ProtectedRoute>
            } />
            <Route path="/consultations/:id/edit" element={
              <ProtectedRoute><EditConsultation /></ProtectedRoute>
            } />

            {/* Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;