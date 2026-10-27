import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import "./adminUser.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:3001/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('No autorizado');
      })
      .then((data) => {
        setUsers(data);
      })
      .catch(() => {
        setError('Error de conexión o permisos insuficientes.');
      });
  }, []);

  if (storedUser?.rol !== 'SUPRA') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleChange = async (id, newRol) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rol: newRol })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Error al actualizar rol');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Error al eliminar usuario');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  return (
    <div className="admin-container">
      <h2>Panel de Administración - Gestión de Usuarios</h2>
      <button onClick={() => navigate('/dashboard')} className="btn-back">
        Volver al Dashboard
      </button>

      {error && <p className="error-message">{error}</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>
                <select 
                  value={u.rol} 
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="admin-select"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPRA">SUPRA</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleDeleteUser(u.id)} className="btn-delete">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}