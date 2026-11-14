// src/components/products.jsx
import { useState, useEffect, useCallback } from 'react';
import { obtenerEstacionActual } from '../utils/dataUtils';
import '../estilos/productos.css';

export default function Products({ activeSection }) {
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modales de categorías
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatNombre, setEditingCatNombre] = useState('');

  // Formulario exclusivo para AÑADIR producto
const [form, setForm] = useState({
    codigo_barras: '',
    nombre: '',
    precio_costo: 0,
    precio_venta: 0,
    categoria_id: '',
    proveedor_id: '',
    temporada_alta: 'TODA_TEMP',
    stock_minimo: 5
  });

  // Estados exclusivos para el MODAL DE EDICIÓN de producto
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    codigo_barras: '',
    nombre: '',
    precio_costo: 0,
    precio_venta: 0,
    categoria_id: '',
    proveedor_id: '',
    temporada_alta: 'TODA_TEMP',
    stock: 0
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const estacionActual = obtenerEstacionActual();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      setError('Error al conectar con el servidor.');
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/categorias');
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch {
      setError('Error al cargar categorías.');
    }
  }, []);

  const fetchProveedores = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/proveedores');
      if (res.ok) {
        const data = await res.json();
        setProveedores(data);
      }
    } catch {
      setError('Error al cargar proveedores.');
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategorias();
    fetchProveedores();
  }, [fetchProducts, fetchCategorias, fetchProveedores]);

  // --- LÓGICA DE CRUD DE CATEGORÍAS ---
  const handleGuardarNuevaCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCatNombre || nuevaCatNombre.trim() === '') return;

    try {
      const res = await fetch('http://localhost:3001/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaCatNombre.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Categoría creada con éxito!');
        setNuevaCatNombre('');
        setShowNewCatModal(false);
        await fetchCategorias();
        setForm(prev => ({ ...prev, categoria_id: data.id.toString() }));
      } else {
        setError(data.message || 'Error al crear la categoría.');
      }
    } catch {
      setError('Error de conexión al crear categoría.');
    }
  };

  const handleGuardarEditCategoria = async (catId) => {
    if (!editingCatNombre || editingCatNombre.trim() === '') return;
    try {
      const res = await fetch(`http://localhost:3001/api/categorias/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editingCatNombre.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setEditingCatId(null);
        setEditingCatNombre('');
        fetchCategorias();
        fetchProducts();
      } else {
        alert(data.message || 'Error al actualizar categoría.');
      }
    } catch {
      alert('Error de conexión al editar categoría.');
    }
  };

  const handleDeleteCategoria = async (catId) => {
    if (!window.confirm('¿Deseas eliminar esta categoría?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/categorias/${catId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        fetchCategorias();
      } else {
        alert(data.message || 'Error al eliminar categoría.');
      }
    } catch {
      alert('Error de conexión al eliminar categoría.');
    }
  };

  // --- LÓGICA DE PRODUCTOS ---
  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Guardar NUEVO producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Producto añadido con éxito!');
        setForm({
          codigo_barras: '',
          nombre: '',
          precio_costo: 0,
          precio_venta: 0,
          categoria_id: '',
          proveedor_id: '',
          temporada_alta: 'TODA_TEMP',
          stock: 0,
          stock_minimo: 5
        });
        fetchProducts();
      } else {
        setError(data.message || 'Error en la operación.');
      }
    } catch {
      setError('Error de conexión.');
    }
  };

  // Abrir modal de edición con los datos del producto seleccionado
const handleOpenEditModal = (product) => {
    setEditForm({
      id: product.id,
      codigo_barras: product.codigo_barras || '',
      nombre: product.nombre || '',
      precio_costo: product.precio_costo || 0,
      precio_venta: product.precio_venta || 0,
      categoria_id: product.categoria_id || '',
      proveedor_id: product.proveedor_id || '',
      temporada_alta: product.temporada_alta || 'TODA_TEMP',
      stock: product.stock || 0,
      stock_minimo: product.stock_minimo_vigente ?? 5
    });
    setShowEditModal(true);
  };

  // Enviar actualización del producto desde el modal
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`http://localhost:3001/api/products/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Producto actualizado con éxito!');
        setShowEditModal(false);
        fetchProducts();
      } else {
        setError(data.message || 'Error al actualizar el producto.');
      }
    } catch {
      setError('Error de conexión al actualizar.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('¡Producto eliminado!');
        fetchProducts();
      }
    } catch {
      setError('Error al eliminar.');
    }
  };

  const filteredProducts = searchTerm.trim() === '' ? [] : products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term))
    );
  });

  return (
    <div>
      {error && <p className="error-message" style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
      {success && <p className="success-message" style={{ color: '#27ae60', marginBottom: '15px' }}>{success}</p>}

      {/* SECCIÓN 1: AÑADIR NUEVO PRODUCTO */}
      {activeSection === 'products-add' && (
        <div className="dashboard-card-inner">
          <h3>Añadir Nuevo Producto</h3>
          <form onSubmit={handleSubmit} className="product-form-embedded">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Código de Barras</label>
                <input type="text" name="codigo_barras" placeholder="Ej. 779123456789" value={form.codigo_barras} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Nombre del Producto</label>
                <input type="text" name="nombre" placeholder="Ej. Alfajor Triple" value={form.nombre} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Precio de Costo ($)</label>
                <input type="number" name="precio_costo" placeholder="0.00" value={form.precio_costo} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Precio de Venta ($)</label>
                <input type="number" name="precio_venta" placeholder="0.00" value={form.precio_venta} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Categoría</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select name="categoria_id" value={form.categoria_id} onChange={handleInputChange} required style={{ flex: 1 }}>
                    <option value="">Seleccione una categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  
                  <button 
                    type="button" 
                    onClick={() => setShowNewCatModal(true)}
                    title="Añadir nueva categoría"
                    style={{ background: '#00bcd4', color: '#0b2545', border: 'none', padding: '0 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                  >
                    +
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setShowCategoryModal(!showCategoryModal)}
                    title="Gestionar categorías existentes"
                    style={{ background: '#0b2545', color: '#fff', border: 'none', padding: '0 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Proveedor</label>
                <select name="proveedor_id" value={form.proveedor_id} onChange={handleInputChange}>
                  <option value="">Seleccione un proveedor (opcional)...</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Temporada Alta</label>
                <select name="temporada_alta" value={form.temporada_alta} onChange={handleInputChange}>
                  <option value="TODA_TEMP">Todo el Año (Regular)</option>
                  <option value="VERANO">Verano</option>
                  <option value="INVIERNO">Invierno</option>
                </select>
              </div>



              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>
                  Stock Mínimo (Alerta Estacional)
                </label>
                <input
                  type="number"
                  name="stock_minimo"
                  min="1"
                  value={form.stock_minimo}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            
            <button type="submit" className="btn-guardar">
              Guardar Producto
              </button>
              
              </div>
          </form>

          {/* POP-UP NUEVA CATEGORÍA */}
          {showNewCatModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: 'rgba(11, 37, 69, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
              <div style={{
                background: '#ffffff', padding: '25px', borderRadius: '10px', width: '100%', maxWidth: '400px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderTop: '5px solid #00bcd4'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#0b2545', fontSize: '18px' }}>Nueva Categoría</h3>
                <form onSubmit={handleGuardarNuevaCategoria}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: '#555' }}>
                      Nombre de la categoría:
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. Golosinas, Bebidas, etc." 
                      value={nuevaCatNombre} 
                      onChange={(e) => setNuevaCatNombre(e.target.value)}
                      required autoFocus
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setShowNewCatModal(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button type="submit" style={{ background: '#00bcd4', color: '#0b2545', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL DE GESTIÓN Y EDICIÓN DE CATEGORÍAS */}
          {showCategoryModal && (
            <div style={{ marginTop: '20px', background: '#f4f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #00bcd4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#0b2545' }}>Gestión de Categorías</h4>
                <button onClick={() => setShowCategoryModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#666' }}>✕ Cerrar</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {categorias.map(cat => (
                  <li key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e1e8ed' }}>
                    {editingCatId === cat.id ? (
                      <div style={{ display: 'flex', gap: '5px', flex: 1, marginRight: '10px' }}>
                        <input type="text" value={editingCatNombre} onChange={(e) => setEditingCatNombre(e.target.value)} style={{ padding: '4px', flex: 1 }} />
                        <button onClick={() => handleGuardarEditCategoria(cat.id)} style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Guardar</button>
                        <button onClick={() => setEditingCatId(null)} style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '14px', color: '#0b2545' }}>{cat.nombre}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => { setEditingCatId(cat.id); setEditingCatNombre(cat.nombre); }} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                          <button onClick={() => handleDeleteCategoria(cat.id)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: BUSCADOR Y GESTIÓN DE PRODUCTOS */}
      {activeSection === 'products-search' && (
        <div className="dashboard-card-inner">
          <h3>Gestión y Buscador de Productos</h3>
          <div style={{ margin: '15px 0' }}>
            <input 
              type="text" 
              placeholder="Escribe para buscar por nombre o código de barras..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {searchTerm.trim() === '' ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p>🔍 Ingrese un término en el buscador para consultar el inventario de productos.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Costo</th>
                  <th>Venta</th>
                  <th>Código</th>
                  <th>Temporada</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron productos coincidentes.</td>
                  </tr>
                ) : (
                    filteredProducts.map((p) => {
                      const umbralAlerta = p.stock_minimo_vigente ?? 5;
                      const isLowStock = p.stock <= umbralAlerta;

                      return (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td>{p.categoria_nombre || 'Sin categoría'}</td>
                          <td style={{ color: isLowStock ? '#e74c3c' : 'inherit', fontWeight: isLowStock ? 'bold' : 'normal' }}>
                            {p.stock} {isLowStock && (
                              <span title={`Alerta (${p.estacion_actual || estacionActual}): Stock actual (${p.stock}) por debajo del mínimo configurado (${umbralAlerta} u.)`}>
                                ⚠️
                              </span>
                            )}
                          </td>
                          <td>${p.precio_costo}</td>
                          <td>${p.precio_venta}</td>
                          <td>{p.codigo_barras}</td>
                          <td>{p.temporada_alta}</td>
                          <td style={{ textAlign: 'center', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button onClick={() => handleOpenEditModal(p)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                            <button onClick={() => handleDelete(p.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* POP-UP / MODAL DE EDICIÓN DE PRODUCTO (Blanco con detalles en turquesa #00bcd4) */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 37, 69, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '600px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderTop: '6px solid #00bcd4', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#0b2545', fontSize: '20px' }}>Editar Producto</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#666' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Código de Barras</label>
                  <input type="text" name="codigo_barras" value={editForm.codigo_barras} onChange={handleEditInputChange} required style={{ width: '100%', padding: '8px' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Nombre del Producto</label>
                  <input type="text" name="nombre" value={editForm.nombre} onChange={handleEditInputChange} required style={{ width: '100%', padding: '8px' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Precio de Costo ($)</label>
                  <input type="number" name="precio_costo" value={editForm.precio_costo} onChange={handleEditInputChange} required style={{ width: '100%', padding: '8px' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Precio de Venta ($)</label>
                  <input type="number" name="precio_venta" value={editForm.precio_venta} onChange={handleEditInputChange} required style={{ width: '100%', padding: '8px' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Categoría</label>
                  <select name="categoria_id" value={editForm.categoria_id} onChange={handleEditInputChange} required style={{ width: '100%', padding: '8px' }}>
                    <option value="">Seleccione una categoría...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Proveedor</label>
                  <select name="proveedor_id" value={editForm.proveedor_id} onChange={handleEditInputChange} style={{ width: '100%', padding: '8px' }}>
                    <option value="">Seleccione un proveedor (opcional)...</option>
                    {proveedores.map((prov) => (
                      <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Temporada Alta</label>
                  <select name="temporada_alta" value={editForm.temporada_alta} onChange={handleEditInputChange} style={{ width: '100%', padding: '8px' }}>
                    <option value="TODA_TEMP">Todo el Año (Regular)</option>
                    <option value="VERANO">Verano</option>
                    <option value="INVIERNO">Invierno</option>
                  </select>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ background: '#00bcd4', color: '#0b2545', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Actualizar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      


    </div>
  );
}
