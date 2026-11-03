import { useState, useEffect, useCallback } from 'react';

export default function Products({ activeSection }) {
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]); // <-- Estado para proveedores
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    codigo_barras: '',
    nombre: '',
    precio_costo: 0,
    precio_venta: 0,
    categoria_id: '',
    proveedor_id: '', // <-- Incluido en el form
    temporada_alta: 'TODA_TEMP',
    stock: 0
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Función para obtener los productos
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

  // 2. Función dinámica para obtener las categorías
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

  // 3. Función dinámica para obtener los proveedores (preparada para el CRUD futuro)
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

  // Cargar todos los datos al iniciar el componente
  useEffect(() => {
    fetchProducts();
    fetchCategorias();
    fetchProveedores();
  }, [fetchProducts, fetchCategorias, fetchProveedores]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = editingId 
      ? `http://localhost:3001/api/products/${editingId}`
      : 'http://localhost:3001/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(editingId ? '¡Producto actualizado!' : '¡Producto añadido con éxito!');
        setForm({
          codigo_barras: '',
          nombre: '',
          precio_costo: 0,
          precio_venta: 0,
          categoria_id: '',
          proveedor_id: '',
          temporada_alta: 'TODA_TEMP',
          stock: 0
        });
        setEditingId(null);
        fetchProducts(); // Refresca la tabla de productos
      } else {
        setError(data.message || 'Error en la operación.');
      }
    } catch {
      setError('Error de conexión.');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      codigo_barras: product.codigo_barras || '',
      nombre: product.nombre || '',
      precio_costo: product.precio_costo || 0,
      precio_venta: product.precio_venta || 0,
      categoria_id: product.categoria_id || '',
      proveedor_id: product.proveedor_id || '', // <-- Carga el proveedor al editar
      temporada_alta: product.temporada_alta || 'TODA_TEMP',
      stock: product.stock || 0
    });
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

  const filteredProducts = products.filter((p) => {
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

      {/* VISTA 1: AÑADIR / EDITAR PRODUCTO */}
      {activeSection === 'products-add' && (
        <div className="dashboard-card-inner">
          <h3>{editingId ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
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

              {/* Selector de Categorías */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Categoría</label>
                <select name="categoria_id" value={form.categoria_id} onChange={handleInputChange} required>
                  <option value="">Seleccione una categoría...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Proveedores (Dinámico) */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Proveedor</label>
                <select name="proveedor_id" value={form.proveedor_id} onChange={handleInputChange}>
                  <option value="">Seleccione un proveedor (opcional)...</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Temporada */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Temporada Alta</label>
                <select name="temporada_alta" value={form.temporada_alta} onChange={handleInputChange}>
                  <option value="TODA_TEMP">Todo el Año (Regular)</option>
                  <option value="VERANO">Verano</option>
                  <option value="INVIERNO">Invierno</option>
                </select>
              </div>

              {/* Stock inicial */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Stock Inicial</label>
                <input type="number" name="stock" placeholder="Cantidad inicial en estantería" value={form.stock} onChange={handleInputChange} required style={{ width: '100%' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-guardar">
                {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
              {editingId && (
                <button type="button" onClick={() => setEditingId(null)} style={{ background: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* VISTA 2: BUSCADOR Y LISTADO DE PRODUCTOS (CRUD) */}
      {activeSection === 'products-search' && (
        <div className="dashboard-card-inner">
          <h3>Gestión y Buscador de Productos</h3>
          <div style={{ margin: '15px 0' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre o código de barras..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= 5;
                return (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.categoria_nombre || 'Sin categoría'}</td>
                    <td style={{ color: isLowStock ? '#e74c3c' : 'inherit', fontWeight: isLowStock ? 'bold' : 'normal' }}>
                      {p.stock} {isLowStock && '⚠️'}
                    </td>
                    <td>${p.precio_costo}</td>
                    <td>${p.precio_venta}</td>
                    <td>{p.codigo_barras}</td>
                    <td>{p.temporada_alta}</td>
                    <td style={{ textAlign: 'center', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button onClick={() => handleEdit(p)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}