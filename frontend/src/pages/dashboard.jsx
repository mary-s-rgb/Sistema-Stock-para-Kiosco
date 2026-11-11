import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Products from '../components/productos';
import '../estilos/dashboard.css';
import Suppliers from '../components/proveedores';
import History from '../components/historial';

export default function Dashboard() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('usuario') || '{}');

  // Estado para controlar qué sección se muestra en el panel derecho
  const [activeSection, setActiveSection] = useState('welcome');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');  
    navigate('/login');
  }; 

  return (
    <div className="dashboard-container">
      <div className="dashboard-main-card">
        
        {/* Barra lateral (Sidebar) turquesa */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>PRODUCTOS</h3>
            <button onClick={() => setActiveSection('products-add')} className="sidebar-link-btn">Añadir nueva</button>
            <button onClick={() => setActiveSection('products-search')} className="sidebar-link-btn">Buscador (filtro)</button>
          </div>

          <div className="sidebar-section">
           <h3>PROVEEDORES</h3>
            <button onClick={() => setActiveSection('suppliers-add')} className="sidebar-link-btn">Añadir nuevo</button>
            <button onClick={() => setActiveSection('suppliers-search')}  className="sidebar-link-btn">Buscador (filtro)</button>
        
          </div>

        <div className="sidebar-section">
          <h3>HISTORIAL</h3>
          <button onClick={() => setActiveSection('history-register')} className="sidebar-link-btn">Registrar Compra</button>
          <button onClick={() => setActiveSection('history-monthly')} className="sidebar-link-btn">Mensual</button>
          <button onClick={() => setActiveSection('history-annual')} className="sidebar-link-btn">Anual</button>
        </div>
{/* Sección de administración visible exclusivamente para el rol SUPRA */}
          {storedUser.rol === 'SUPRA' && (
            <div className="sidebar-section">
              <h3>ADMINISTRACIÓN</h3>
              <button onClick={() => navigate('/admin/users')} className="sidebar-link-btn">
                Gestionar Usuarios (SUPRA)
              </button>
            </div>
          )}

          <button onClick={handleLogout} className="btn-logout-app">
            Cerrar Sesión
          </button>
        </aside>

        {/* Área de contenido principal dinámica a la derecha */}
        <main className="dashboard-content-area">
          <div className="dashboard-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Panel Principal</span>
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#555' }}>
              Hola, {storedUser.nombre || 'Usuario'} ({storedUser.rol})
            </span>
          </div>

          {/* VISTA 1: BIENVENIDA */}
          {activeSection === 'welcome' && (
            <div className="dashboard-card-inner">
              <h2>Bienvenido al sistema de control de stock</h2>
              <p>Utiliza el menú lateral turquesa para navegar entre las opciones de Productos, Proveedores e Historial.</p>
              
             
            </div>
          )}

          {/* RENDERIZADO DEL MÓDULO DE PRODUCTOS */}
          {activeSection.startsWith('products') && (
            <Products activeSection={activeSection} />
          )}

          {/* Módulo de Proveedores */}
          {(activeSection === 'suppliers-add' || activeSection === 'suppliers-search') && (
            <Suppliers activeSection={activeSection} />
          )}

          {activeSection.startsWith('history') && (
            <History activeSection={activeSection} />
          )}

        </main>
      </div>
    </div>
  );
}