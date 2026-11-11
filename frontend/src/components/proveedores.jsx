// src/components/proveedores.jsx
import { useState, useEffect, useCallback } from 'react';
import '../estilos/dashboard.css';

export default function Suppliers({ activeSection }) {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario exclusivo para AÑADIR proveedor
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });

  // Estados exclusivos para el MODAL DE EDICIÓN de proveedor
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    nombre: '',
    telefono: '',
    email: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch {
      setError('Error al conectar con el servidor.');
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Guardar NUEVO proveedor
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:3001/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Proveedor registrado con éxito!');
        setForm({ nombre: '', telefono: '', email: '' });
        fetchSuppliers();
      } else {
        setError(data.message || 'Error en la operación.');
      }
    } catch {
      setError('Error de conexión.');
    }
  };

  // Abrir modal de edición con los datos del proveedor seleccionado
  const handleOpenEditModal = (supplier) => {
    setEditForm({
      id: supplier.id,
      nombre: supplier.nombre || '',
      telefono: supplier.telefono || '',
      email: supplier.email || ''
    });
    setShowEditModal(true);
  };

  // Enviar actualización del proveedor desde el modal
  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:3001/api/suppliers/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editForm.nombre,
          telefono: editForm.telefono,
          email: editForm.email
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Proveedor actualizado con éxito!');
        setShowEditModal(false);
        fetchSuppliers();
      } else {
        setError(data.message || 'Error al actualizar el proveedor.');
      }
    } catch {
      setError('Error de conexión al actualizar.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este proveedor?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setSuccess('¡Proveedor eliminado!');
        fetchSuppliers();
      } else {
        setError(data.message || 'No se puede eliminar el proveedor.');
      }
    } catch {
      setError('Error al eliminar.');
    }
  };

  const filteredSuppliers = searchTerm.trim() === '' ? [] : suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.nombre && s.nombre.toLowerCase().includes(term)) ||
      (s.telefono && s.telefono.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {error && <p className="error-message" style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
      {success && <p className="success-message" style={{ color: '#27ae60', marginBottom: '15px' }}>{success}</p>}

      {/* SECCIÓN 1: AÑADIR NUEVO PROVEEDOR */}
      {activeSection === 'suppliers-add' && (
        <div className="dashboard-card-inner">
          <h3>Registrar Nuevo Proveedor</h3>
          <form onSubmit={handleSubmit} className="product-form-embedded">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Nombre / Empresa</label>
                <input type="text" name="nombre" placeholder="Ej. Distribuidora Mayorista S.A." value={form.nombre} onChange={handleInputChange} required style={{ width: '100%', padding: '10px' }} />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Teléfono</label>
                <input type="text" name="telefono" placeholder="Ej. 3451234567" value={form.telefono} onChange={handleInputChange} style={{ width: '100%', padding: '10px' }} />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Correo Electrónico</label>
                <input type="email" name="email" placeholder="Ej. ventas@distribuidora.com" value={form.email} onChange={handleInputChange} style={{ width: '100%', padding: '10px' }} />
              </div>
            </div>
            
            <button type="submit" className="btn-guardar" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>
              Guardar Proveedor
            </button>
          </form>
        </div>
      )}

      {/* SECCIÓN 2: BUSCADOR Y GESTIÓN DE PROVEEDORES */}
      {activeSection === 'suppliers-search' && (
        <div className="dashboard-card-inner">
          <h3>Gestión y Buscador de Proveedores</h3>
          <div style={{ margin: '15px 0' }}>
            <input 
              type="text" 
              placeholder="Escribe para buscar por nombre, teléfono o email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {searchTerm.trim() === '' ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p>🔍 Ingrese un término en el buscador para consultar los proveedores registrados.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre / Empresa</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron proveedores coincidentes.</td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id}>
                      <td>{s.nombre}</td>
                      <td>{s.telefono || 'Sin teléfono'}</td>
                      <td>{s.email || 'Sin correo'}</td>
                      <td style={{ textAlign: 'center', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => handleOpenEditModal(s)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => handleDelete(s.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* POP-UP / MODAL DE EDICIÓN DE PROVEEDOR (Blanco con detalles en turquesa #00bcd4) */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 37, 69, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '500px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderTop: '6px solid #00bcd4'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0b2545', fontSize: '20px' }}>Editar Proveedor</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#666' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateSupplier}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Nombre / Empresa</label>
                  <input type="text" name="nombre" value={editForm.nombre} onChange={handleEditInputChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Teléfono</label>
                  <input type="text" name="telefono" value={editForm.telefono} onChange={handleEditInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Correo Electrónico</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ background: '#00bcd4', color: '#0b2545', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Actualizar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}