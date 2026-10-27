import { useNavigate } from 'react-router-dom';
import './';

export default function Dashboard() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');  
    navigate('/login');
  }; 

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <h3>Kiosco App</h3>
        </div>
        <div className="navbar-user">
          <span>Hola, <strong>{storedUser.nombre || 'Administrador'}</strong> ({storedUser.rol})</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="dashboard-card">
          <h2>Panel Principal</h2>
          <p>Bienvenido al sistema de gestión y control de stock.</p>
          
          {storedUser.rol === 'SUPRA' && (
            <div className="admin-shortcut">
              <button 
                onClick={() => navigate('/admin/users')} 
                className="btn-admin-shortcut"
              >
                Gestionar Usuarios (SUPRA)
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}