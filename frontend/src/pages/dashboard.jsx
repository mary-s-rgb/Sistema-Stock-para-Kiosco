import { useNavigate } from 'react-router-dom';
import './dashboard.css';

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
      {/* Tarjeta principal contenedora */}
      <div className="dashboard-main-card">
        
        {/* Barra lateral (Sidebar) idéntica al diseño de referencia */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>PRODUCTOS</h3>
            <a href="#categorias" className="sidebar-link">Categorías</a>
            <a href="#buscador" className="sidebar-link">Buscador (filtro)</a>
          </div>

          <div className="sidebar-section">
            <h3>PROVEEDORES</h3>
            <a href="#prov-cat" className="sidebar-link">Categorías</a>
            <a href="#prov-busc" className="sidebar-link">Buscador (filtro)</a>
          </div>

          <div className="sidebar-section">
            <h3>HISTORIAL</h3>
            <a href="#mensual" className="sidebar-link">Mensual</a>
            <a href="#anual" className="sidebar-link">Anual</a>
          </div>

          <button onClick={handleLogout} className="btn-logout-app">
            Cerrar Sesión
          </button>
        </aside>

        {/* Área de contenido principal a la derecha */}
        <main className="dashboard-content-area">
          <div className="dashboard-header-title">
            Panel Principal
          </div>
          
          <div className="dashboard-card-inner">
            <h2>Bienvenido, {storedUser.nombre || 'Administrador'}</h2>
            <p>Rol actual: <strong>{storedUser.rol}</strong></p>
            <p>Utiliza el menú lateral para navegar por el sistema de gestión y control de stock.</p>
            
            {/* Si el usuario es SUPRA, mostramos el acceso directo al panel de usuarios */}
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
    </div>
  );
}