import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "./recover-password.css";

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:3001/api/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setStep(2);
      } else {
        setError(data.message || 'No se pudo verificar el correo.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:3001/api/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        alert('¡Contraseña actualizada con éxito! Redirigiendo al login...');
        navigate('/login');
      } else {
        setError(data.message || 'Error al actualizar la contraseña.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Recuperar Contraseña</h2>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        {step === 1 ? (
          <form onSubmit={handleVerifyEmail} className="auth-form">
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                placeholder="Ingresa tu email registrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit">
              Verificar Correo
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-submit">
              Actualizar Contraseña
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login" className="forgot-password-link">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}