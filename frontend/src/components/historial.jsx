import { useState, useEffect, useCallback } from 'react';
import { obtenerFechaActualISO } from '../utils/dataUtils';

export default function History({ activeSection }) {
  const [compras, setCompras] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  // Estado para el modal de detalle de una factura seleccionada
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [detallesFacturaModal, setDetallesFacturaModal] = useState([]);

  // Estado para desplegar compras de un mes en particular desde la vista anual
  const [mesDetalleSeleccionado, setMesDetalleSeleccionado] = useState(null);

  // Estados para el formulario de FACTURA DE COMPRA ÚNICA (Carrito)
  const [facturaHeader, setFacturaHeader] = useState({
    numero_factura: '',
    proveedor_id: '',
    fecha: obtenerFechaActualISO()
  });

  const [itemActual, setItemActual] = useState({
    producto_id: '',
    cantidad: 1,
    precio_costo_unitario: 0
  });

  const [itemsFactura, setItemsFactura] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCompras = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/compras');
      if (res.ok) {
        const data = await res.json();
        setCompras(data);
      }
    } catch {
      setError('Error al conectar con el servidor.');
    }
  }, []);

  const fetchFacturas = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/facturas-compra');
      if (res.ok) {
        const data = await res.json();
        setFacturas(data);
      }
    } catch {
      setError('Error al cargar las facturas.');
    }
  }, []);

  const fetchProductosYProveedores = useCallback(async () => {
    try {
      const resProd = await fetch('http://localhost:3001/api/products');
      if (resProd.ok) setProductos(await resProd.json());

      const resProv = await fetch('http://localhost:3001/api/suppliers');
      if (resProv.ok) setProveedores(await resProv.json());
    } catch {
      setError('Error al cargar datos auxiliares.');
    }
  }, []);

  useEffect(() => {
    fetchCompras();
    fetchFacturas();
    fetchProductosYProveedores();
  }, [fetchCompras, fetchFacturas, fetchProductosYProveedores]);

  // Manejadores para la cabecera de la factura
  const handleHeaderChange = (e) => {
    setFacturaHeader({ ...facturaHeader, [e.target.name]: e.target.value });
  };

  // Manejadores para el ítem individual que se va a agregar al carrito
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemActual({ ...itemActual, [name]: value });

    if (name === 'producto_id') {
      const prodSeleccionado = productos.find(p => p.id.toString() === value);
      if (prodSeleccionado) {
        setItemActual(prev => ({
          ...prev,
          producto_id: value,
          precio_costo_unitario: prodSeleccionado.precio_costo || 0
        }));
      }
    }
  };

  const handleAgregarItem = (e) => {
    e.preventDefault();
    if (!itemActual.producto_id || itemActual.cantidad <= 0 || itemActual.precio_costo_unitario < 0) {
      setError('Selecciona un producto válido, cantidad mayor a 0 y costo válido.');
      return;
    }
    setError('');

    const prodInfo = productos.find(p => p.id.toString() === itemActual.producto_id);

    const nuevoItem = {
      producto_id: itemActual.producto_id,
      nombre_producto: prodInfo ? prodInfo.nombre : 'Desconocido',
      cantidad: Number(itemActual.cantidad),
      precio_costo_unitario: Number(itemActual.precio_costo_unitario),
      subtotal: Number(itemActual.cantidad) * Number(itemActual.precio_costo_unitario)
    };

    setItemsFactura([...itemsFactura, nuevoItem]);
    setItemActual({ producto_id: '', cantidad: 1, precio_costo_unitario: 0 });
  };

  const handleQuitarItem = (index) => {
    const nuevosItems = itemsFactura.filter((_, i) => i !== index);
    setItemsFactura(nuevosItems);
  };

  const totalGeneralFactura = itemsFactura.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSubmitFactura = async () => {
    setError('');
    setSuccess('');

    if (!facturaHeader.numero_factura || !facturaHeader.fecha) {
      setError('El número de factura y la fecha son obligatorios.');
      return;
    }

    if (itemsFactura.length === 0) {
      setError('La factura debe contener al menos un producto agregado.');
      return;
    }

    const payload = {
      proveedor_id: facturaHeader.proveedor_id ? Number(facturaHeader.proveedor_id) : null,
      numero_factura: facturaHeader.numero_factura,
      fecha: facturaHeader.fecha,
      items: itemsFactura.map(i => ({
        producto_id: Number(i.producto_id),
        cantidad: i.cantidad,
        precio_costo_unitario: i.precio_costo_unitario
      }))
    };

    try {
      const res = await fetch('http://localhost:3001/api/facturas-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Factura registrada con éxito y stocks actualizados!');
        setFacturaHeader({
          numero_factura: '',
          proveedor_id: '',
          fecha: obtenerFechaActualISO()
        });
        setItemsFactura([]);
        fetchCompras();
        fetchFacturas();
        fetchProductosYProveedores();
      } else {
        setError(data.message || 'Error al registrar la factura.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    }
  };

  // Abrir modal con los detalles de una factura específica
  const handleVerDetalleFactura = async (factura) => {
    setFacturaSeleccionada(factura);
    try {
      const res = await fetch(`http://localhost:3001/api/facturas-compra/${factura.id}/detalles`);
      if (res.ok) {
        const data = await res.json();
        setDetallesFacturaModal(data);
        setShowFacturaModal(true);
      }
    } catch {
      setError('Error al obtener el detalle de la factura.');
    }
  };

  // Función para eliminar factura (Solo permitida si es del mes actual por seguridad)
  const handleDeleteFactura = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta factura?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/facturas-compra/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('¡Factura eliminada y stock revertido con éxito!');
        fetchFacturas();
        fetchCompras();
      } else {
        setError(data.message || 'Error al eliminar la factura.');
      }
    } catch {
      setError('Error de conexión al eliminar.');
    }
  };

  // Función para validar en React si una fecha corresponde al mes actual
  const esMesActual = (fechaStr) => {
    if (!fechaStr) return false;
    const [anioF, mesF] = fechaStr.split('-');
    const now = new Date();
    const anioA = now.getFullYear().toString();
    const mesA = (now.getMonth() + 1).toString().padStart(2, '0');
    return anioF === anioA && mesF === mesA;
  };

  // Nombres de los meses y cálculos anuales
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const fechaActualObj = new Date();
  const anioActual = fechaActualObj.getFullYear().toString();
  const mesActualNum = (fechaActualObj.getMonth() + 1).toString().padStart(2, '0');

  const comprasDelAnio = compras.filter((c) => {
    if (!c.fecha) return false;
    return c.fecha.split('-')[0] === anioActual;
  });

  let gastoTotalAnual = 0;
  let unidadesTotalesAnual = 0;
  const mesesMap = {};
  const productosMap = {};

  for (let i = 1; i <= 12; i++) {
    const key = i.toString().padStart(2, '0');
    mesesMap[key] = {
      numMes: key,
      nombreMes: nombresMeses[i - 1],
      operaciones: 0,
      unidades: 0,
      totalGasto: 0
    };
  }

  comprasDelAnio.forEach((c) => {
    const [, mes] = c.fecha.split('-');
    const costoSubtotal = Number(c.cantidad) * Number(c.precio_costo_unitario);

    gastoTotalAnual += costoSubtotal;
    unidadesTotalesAnual += Number(c.cantidad);

    if (mesesMap[mes]) {
      mesesMap[mes].operaciones += 1;
      mesesMap[mes].unidades += Number(c.cantidad);
      mesesMap[mes].totalGasto += costoSubtotal;
    }

    const prodNombre = c.producto_nombre || 'Producto Desconocido';
    if (!productosMap[prodNombre]) {
      productosMap[prodNombre] = { nombre: prodNombre, unidades: 0, totalGasto: 0 };
    }
    productosMap[prodNombre].unidades += Number(c.cantidad);
    productosMap[prodNombre].totalGasto += costoSubtotal;
  });

  let mesPicoInversion = { nombreMes: 'Sin datos', totalGasto: 0 };
  Object.values(mesesMap).forEach((m) => {
    if (m.totalGasto > mesPicoInversion.totalGasto) {
      mesPicoInversion = m;
    }
  });

  const top5Productos = Object.values(productosMap)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5);

  const comprasMensuales = compras.filter((c) => {
    if (!c.fecha) return false;
    const [anio, mes] = c.fecha.split('-');
    return anio === anioActual && mes === mesActualNum;
  });

  return (
    <div>
      {error && <p style={{ color: '#e74c3c', marginBottom: '15px', fontWeight: 'bold' }}>{error}</p>}
      {success && <p style={{ color: '#27ae60', marginBottom: '15px', fontWeight: 'bold' }}>{success}</p>}

      {/* VISTA 1: REGISTRAR FACTURA DE COMPRA (CARRITO POR LOTES) */}
      {activeSection === 'history-register' && (
        <div className="dashboard-card-inner">
          <h3>Registrar Factura de Compra / Entrada de Stock</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px', marginBottom: '20px', background: '#f4f9fa', padding: '15px', borderRadius: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Nº de Factura</label>
              <input type="text" name="numero_factura" placeholder="Ej: A-0001-0000421" value={facturaHeader.numero_factura} onChange={handleHeaderChange} required style={{ width: '100%', padding: '8px' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Proveedor</label>
              <select name="proveedor_id" value={facturaHeader.proveedor_id} onChange={handleHeaderChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">Seleccione proveedor...</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#0b2545' }}>Fecha de Emisión</label>
              <input type="date" name="fecha" value={facturaHeader.fecha} onChange={handleHeaderChange} required style={{ width: '100%', padding: '8px' }} />
            </div>
          </div>

          <form onSubmit={handleAgregarItem} style={{ background: '#fff', border: '1px solid #e1e8ed', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0b2545', fontSize: '15px' }}>Agregar Productos a la Factura</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Producto</label>
                <select name="producto_id" value={itemActual.producto_id} onChange={handleItemChange} style={{ width: '100%', padding: '8px' }}>
                  <option value="">Seleccione producto...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Cantidad</label>
                <input type="number" name="cantidad" min="1" value={itemActual.cantidad} onChange={handleItemChange} style={{ width: '100%', padding: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Costo Unit. ($)</label>
                <input type="number" step="0.01" name="precio_costo_unitario" value={itemActual.precio_costo_unitario} onChange={handleItemChange} style={{ width: '100%', padding: '8px' }} />
              </div>

              <button type="submit" style={{ background: '#0b2545', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', height: '37px' }}>
                + Añadir
              </button>
            </div>
          </form>

          <h4 style={{ margin: '15px 0 10px 0', color: '#0b2545', fontSize: '15px' }}>Ítems en esta Factura</h4>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
                <th>Subtotal</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {itemsFactura.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: '#666' }}>No hay productos añadidos todavía.</td>
                </tr>
              ) : (
                itemsFactura.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nombre_producto}</td>
                    <td>{item.cantidad} u.</td>
                    <td>${item.precio_costo_unitario.toLocaleString()}</td>
                    <td><strong>${item.subtotal.toLocaleString()}</strong></td>
                    <td>
                      <button type="button" onClick={() => handleQuitarItem(index)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', background: '#f4f9fa', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ margin: 0, color: '#0b2545' }}>Total Factura: ${totalGeneralFactura.toLocaleString()}</h3>
            
            <button type="button" onClick={handleSubmitFactura} style={{ background: '#00bcd4', color: '#0b2545', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              Registrar Factura y Actualizar Stock
            </button>
          </div>
        </div>
      )}

      {/* VISTA NUEVA: LISTADO GENERAL DE FACTURAS REGISTRADAS (Con candado de seguridad para meses pasados) */}
      {activeSection === 'history-invoices' && (
        <div className="dashboard-card-inner">
          <h3>Listado General de Facturas de Compra</h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>Consulta todas las facturas ingresadas al sistema y gestiona las del mes actual.</p>

          <table>
            <thead>
              <tr>
                <th>Nº Factura</th>
                <th>Proveedor</th>
                <th>Fecha de Emisión</th>
                <th>Total ($)</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No hay facturas registradas.</td>
                </tr>
              ) : (
                facturas.map((f) => {
                  const editable = esMesActual(f.fecha);

                  return (
                    <tr key={f.id}>
                      <td><strong>{f.numero_factura}</strong></td>
                      <td>{f.proveedor_nombre || 'Sin proveedor asignado'}</td>
                      <td>{f.fecha}</td>
                      <td><strong>${f.total.toLocaleString()}</strong></td>
                      <td style={{ textAlign: 'center', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleVerDetalleFactura(f)}
                          style={{ background: '#00bcd4', color: '#0b2545', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          Ver Detalle
                        </button>

                        {editable ? (
                          <button 
                            onClick={() => handleDeleteFactura(f.id)}
                            style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Eliminar
                          </button>
                        ) : (
                          <span title="Bloqueado por seguridad: Corresponde a un periodo anterior cerrado" style={{ fontSize: '12px', color: '#e74c3c', cursor: 'not-allowed', alignSelf: 'center', fontWeight: 'bold', padding: '0 5px' }}>
                            🔒 Cerrado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 2: HISTORIAL MENSUAL ESTÁNDAR */}
      {activeSection === 'history-monthly' && (
        <div className="dashboard-card-inner">
          <h3>Historial de Compras del Mes ({nombresMeses[parseInt(mesActualNum, 10) - 1]} {anioActual})</h3>
          
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {comprasMensuales.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay registros de compras en este mes.</td>
                </tr>
              ) : (
                comprasMensuales.map((c) => (
                  <tr key={c.id}>
                    <td>{c.fecha}</td>
                    <td>{c.producto_nombre || 'Producto desconocido'}</td>
                    <td>{c.proveedor_nombre || 'Sin proveedor'}</td>
                    <td>{c.cantidad}</td>
                    <td>${Number(c.precio_costo_unitario).toLocaleString()}</td>
                    <td>${(c.cantidad * c.precio_costo_unitario).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 3: RESUMEN ANUAL ESCALABLE (KPIs + Tabla por Mes + Top 5) */}
      {activeSection === 'history-annual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            <div className="dashboard-card-inner" style={{ textAlign: 'center', borderLeft: '5px solid #00bcd4' }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>INVERSIÓN TOTAL ANUAL</span>
              <h2 style={{ margin: '8px 0 0', color: '#0b2545', fontSize: '22px' }}>${gastoTotalAnual.toLocaleString()}</h2>
            </div>

            <div className="dashboard-card-inner" style={{ textAlign: 'center', borderLeft: '5px solid #00bcd4' }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>UNIDADES INGRESADAS</span>
              <h2 style={{ margin: '8px 0 0', color: '#0b2545', fontSize: '22px' }}>{unidadesTotalesAnual.toLocaleString()} u.</h2>
            </div>

            <div className="dashboard-card-inner" style={{ textAlign: 'center', borderLeft: '5px solid #00bcd4' }}>
              <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>MES DE MAYOR INVERSIÓN</span>
              <h2 style={{ margin: '8px 0 0', color: '#0b2545', fontSize: '18px' }}>
                {mesPicoInversion.nombreMes} 
                <span style={{ display: 'block', fontSize: '13px', color: '#666', fontWeight: 'normal' }}>
                  (${mesPicoInversion.totalGasto.toLocaleString()})
                </span>
              </h2>
            </div>
          </div>

          <div className="dashboard-card-inner">
            <h3>Resumen de Compras por Mes ({anioActual})</h3>
            
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Compras Realizadas</th>
                  <th>Unidades Compradas</th>
                  <th>Inversión Total ($)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(mesesMap).map((m) => (
                  <tr key={m.numMes} style={{ backgroundColor: m.totalGasto > 0 ? '#fcfcfc' : 'transparent' }}>
                    <td><strong>{m.nombreMes}</strong></td>
                    <td>{m.operaciones} reg.</td>
                    <td>{m.unidades} u.</td>
                    <td><strong>${m.totalGasto.toLocaleString()}</strong></td>
                    <td>
                      {m.operaciones > 0 ? (
                        <button 
                          onClick={() => setMesDetalleSeleccionado(mesDetalleSeleccionado === m.numMes ? null : m.numMes)}
                          style={{ background: '#00bcd4', color: '#0b2545', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          {mesDetalleSeleccionado === m.numMes ? 'Ocultar Detalle' : 'Ver Detalle'}
                        </button>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '12px' }}>Sin registros</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mesDetalleSeleccionado && (
            <div className="dashboard-card-inner" style={{ border: '2px solid #00bcd4' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0b2545' }}>
                Detalle de Operaciones de {nombresMeses[parseInt(mesDetalleSeleccionado, 10) - 1]}
              </h4>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Proveedor</th>
                    <th>Cantidad</th>
                    <th>Costo Unit.</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasDelAnio
                    .filter((c) => c.fecha.split('-')[1] === mesDetalleSeleccionado)
                    .map((c) => (
                      <tr key={c.id}>
                        <td>{c.fecha}</td>
                        <td>{c.producto_nombre}</td>
                        <td>{c.proveedor_nombre || 'Sin proveedor'}</td>
                        <td>{c.cantidad}</td>
                        <td>${Number(c.precio_costo_unitario).toLocaleString()}</td>
                        <td>${(c.cantidad * c.precio_costo_unitario).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="dashboard-card-inner">
            <h3>Top 5 Productos Más Adquiridos del Año</h3>
            {top5Productos.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>No hay datos suficientes este año.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
                {top5Productos.map((prod, index) => (
                  <div key={prod.nombre} style={{ background: '#f4f9fa', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #00bcd4' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00bcd4' }}>#{index + 1} TOP COMPRA</span>
                    <h4 style={{ margin: '5px 0', color: '#0b2545', fontSize: '15px' }}>{prod.nombre}</h4>
                    <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>Ingresadas: <strong>{prod.unidades} u.</strong></p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#555' }}>Invertido: <strong>${prod.totalGasto.toLocaleString()}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* POP-UP / MODAL PARA VER EL DETALLE DE ÍTEMS DE LA FACTURA SELECCIONADA */}
      {showFacturaModal && facturaSeleccionada && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(11, 37, 69, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '1000'
        }}>
          <div style={{
            background: '#ffffff', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '650px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderTop: '6px solid #00bcd4', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0b2545', fontSize: '18px' }}>Factura: {facturaSeleccionada.numero_factura}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#555' }}>
                  Proveedor: <strong>{facturaSeleccionada.proveedor_nombre || 'Sin proveedor'}</strong> | Fecha: <strong>{facturaSeleccionada.fecha}</strong>
                </p>
              </div>
              <button onClick={() => setShowFacturaModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: '#666' }}>✕</button>
            </div>

            <h4 style={{ margin: '15px 0 10px 0', color: '#0b2545', fontSize: '14px' }}>Productos Incluidos en la Factura</h4>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Costo Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detallesFacturaModal.map((detalle, idx) => (
                  <tr key={idx}>
                    <td>{detalle.producto_nombre || 'Producto desconocido'}</td>
                    <td>{detalle.cantidad} u.</td>
                    <td>${Number(detalle.precio_costo_unitario).toLocaleString()}</td>
                    <td><strong>${(detalle.cantidad * detalle.precio_costo_unitario).toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', background: '#f4f9fa', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontWeight: 'bold', color: '#0b2545' }}>Total de la Factura:</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00bcd4' }}>${facturaSeleccionada.total.toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowFacturaModal(false)} style={{ background: '#0b2545', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}