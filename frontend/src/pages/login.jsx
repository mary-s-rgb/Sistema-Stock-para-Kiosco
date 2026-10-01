import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logoKiosco from '../assets/logo-kiosco.png';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
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
            <input
              type="password"
              className="login-input"
              placeholder="contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

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