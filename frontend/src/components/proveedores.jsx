// src/components/proveedores.jsx
import { useState, useEffect, useCallback } from 'react';
import '../estilos/dashboard.css';

export default function Suppliers({ activeSection }) {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = editingId 
      ? `http://localhost:3001/api/suppliers/${editingId}`
      : 'http://localhost:3001/api/suppliers';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? '¡Proveedor actualizado!' : '¡Proveedor registrado con éxito!');
        setForm({ nombre: '', telefono: '', email: '' });
        setEditingId(null);
        fetchSuppliers();
      } else {
        setError(data.message || 'Error en la operación.');
      }
    } catch {
      setError('Error de conexión.');
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      nombre: supplier.nombre || '',
      telefono: supplier.telefono || '',
      email: supplier.email || ''
    });
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

      {activeSection === 'suppliers-add' && (
        <div className="dashboard-card-inner">
          <h3>{editingId ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}</h3>
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
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-guardar" style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>
                {editingId ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm({ nombre: '', telefono: '', email: '' }); }} style={{ background: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>
      )}

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
                        <button onClick={() => handleEdit(s)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
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
    </div>
  );
}