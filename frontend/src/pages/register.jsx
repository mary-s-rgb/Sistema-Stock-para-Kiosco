import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import logoKiosco from '../assets/logo-kiosco.png';

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'ADMIN'
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan antes de enviar a la API
    if (form.password !== form.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: form.rol
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('¡Usuario creado con éxito!');
        navigate('/login');
      } else {
        alert(data.error || 'Error al registrar el usuario');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="register-container">
      {/* Sección Izquierda: Formulario */}
      <div className="register-left-section">
        <div className="register-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          CREAR USUARIO
        </div>

        <div className="register-card">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="register-input"
              placeholder="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
            <input
              type="email"
              className="register-input"
              placeholder="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="password"
              className="register-input"
              placeholder="contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <input
              type="password"
              className="register-input"
              placeholder="repetir contraseña"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />

            {/* Selector opcional de Rol para la base de datos */}
            <select
              className="register-select"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SUPRA">SUPRA</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="submit" className="register-submit-btn">
                crear
              </button>
            </div>
          </form>
        </div>

        <button
          type="button"
          className="back-to-login-btn"
          onClick={() => navigate('/login')}
        >
          INICIAR SESIÓN
        </button>
      </div>

      {/* Sección Derecha: Marca/Logotipo */}
        <div className="login-right-section">
        <img src={logoKiosco} alt="Logo Kiosco" className="brand-logo-img" />
      </div>
    </div>
  );
}