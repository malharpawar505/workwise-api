import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AppShell from './components/shared/AppShell';
import Dashboard from './components/dashboard/Dashboard';
import Records from './components/attendance/Records';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="records" element={<Records />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
          }
        }}
      />
    </AuthProvider>
  );
}
