// Ejemplo de cómo quedará tu App.jsx al añadir la ruta de recuperación:
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/dashboard';
import RecoverPassword from './pages/recover-password';
import AdminUser from './pages/adminUser';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/recover-password" element={<RecoverPassword />} /> */}
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/recover-password" element={<RecoverPassword />} />

        <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminUser />
            </ProtectedRoute>
          } />

      </Routes>
    </BrowserRouter>
  );
}