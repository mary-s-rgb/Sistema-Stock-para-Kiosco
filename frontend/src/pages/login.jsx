import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logoKiosco from '../assets/logo-kiosco.png';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        navigate('/dashboard');
      } else {
        alert(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="login-container">
      {/* Sección Izquierda: Formulario */}
      <div className="login-left-section">
        <div className="login-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          INICIAR SESIÓN
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="login-input"
              placeholder="usuario / email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            {/* Campo Contraseña con Botón de Ojo */}
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input password-input"
                placeholder="contraseña"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label="Mostrar u ocultar contraseña"
              >
                {showPassword ? (
                  /* Ícono Ojo Abierto */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  /* Ícono Ojo Cerrado / Tachado */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => navigate('/recover-password')}
              >
                ¿olvidaste tu contraseña?
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="login-submit-btn">
                enviar
              </button>
            </div>
          </form>
        </div>

        <button
          type="button"
          className="create-user-btn"
          onClick={() => navigate('/register')}
        >
          CREAR USUARIO
        </button>
      </div>

      {/* Sección Derecha: Marca/Logotipo */}
      <div className="login-right-section">
        <img src={logoKiosco} alt="Logo Kiosco" className="brand-logo-img" />
      </div>
    </div>
  );
}