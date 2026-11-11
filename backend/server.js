//server.js

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'clave_secreta_kiosco';

app.use(cors());
app.use(express.json());

// 1. PRIMERO: Inicializamos la conexión a la base de datos SQLite
const db = new sqlite3.Database(
  path.resolve(__dirname, 'kiosco.db'),
  (err) => {
    if (err) console.error('Error al conectar con la base de datos:', err.message);
    else console.log('Conectado a la base de datos kiosco.db');
  }
);

// 2. SEGUNDO: Importamos y montamos las rutas modulares (pasando 'db' correctamente ya inicializada)
const recoverPasswordRoutes = require('./recover-password');
app.use('/api', recoverPasswordRoutes(db));

// Endpoint 1: Registro de Usuarios
app.post('/api/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Campos incompletos' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO usuarios (nombre, email, password_hash, rol)
      VALUES (?, ?, ?, ?)
    `;

    db.run(query, [nombre, email, password_hash, rol || 'ADMIN'], function (err) {
      if (err) {
        return res.status(400).json({ error: 'El email ya se encuentra registrado' });
      }

      res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        id: this.lastID
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint 2: Login de Usuarios
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Campos incompletos' });
  }

  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
    if (err) return res.status(500).json({ error: 'Error interno del servidor' });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

    try {
      const valida = await bcrypt.compare(password, usuario.password_hash);
      if (!valida) return res.status(401).json({ error: 'Credenciales inválidas' });

      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        SECRET_KEY,
        { expiresIn: '8h' }
      );

      res.json({
        mensaje: 'Inicio de sesión exitoso',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          rol: usuario.rol
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
});

// Middleware seguro para verificar rol SUPRA mediante JWT
const verifySupraRole = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.rol !== 'SUPRA') {
      return res.status(403).json({ message: 'Acceso denegado: Requiere permisos SUPRA.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
};

app.post('/api/facturas-compra', (req, res) => {
  const { proveedor_id, numero_factura, fecha, items } = req.body;

  if (!numero_factura || !fecha || !items || items.length === 0) {
    return res.status(400).json({ message: 'Faltan datos de la factura o los ítems están vacíos.' });
  }

  // Calcular el total general de la factura
  const totalFactura = items.reduce((acc, item) => acc + (Number(item.cantidad) * Number(item.precio_costo_unitario)), 0);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    // 1. Insertar la Cabecera de la Factura
    const queryCabecera = `INSERT INTO facturas_compra (proveedor_id, numero_factura, fecha, total) VALUES (?, ?, ?, ?)`;
    
    db.run(queryCabecera, [proveedor_id || null, numero_factura, fecha, totalFactura], function(errCabecera) {
      if (errCabecera) {
        db.run('ROLLBACK;');
        return res.status(500).json({ message: 'Error al registrar la cabecera de la factura.' });
      }

      const facturaId = this.lastID;
      let erroresEnItems = false;

      // 2. Procesar cada ítem del detalle
      items.forEach((item) => {
        if (erroresEnItems) return;

        const queryDetalle = `INSERT INTO detalle_compras (factura_id, producto_id, cantidad, precio_costo_unitario) VALUES (?, ?, ?, ?)`;
        
        db.run(queryDetalle, [facturaId, item.producto_id, item.cantidad, item.precio_costo_unitario], (errDetalle) => {
          if (errDetalle) erroresEnItems = true;
        });

        // 3. Actualizar el stock actual del producto en la tabla 'stock'
        const queryUpdateStock = `
          INSERT INTO stock (producto_id, cantidad_actual) VALUES (?, ?)
          ON CONFLICT(producto_id) DO UPDATE SET cantidad_actual = cantidad_actual + ?
        `;
        db.run(queryUpdateStock, [item.producto_id, item.cantidad, item.cantidad], (errStock) => {
          if (errStock) erroresEnItems = true;
        });
      });

      if (erroresEnItems) {
        db.run('ROLLBACK;');
        return res.status(500).json({ message: 'Error al procesar los ítems o actualizar el stock.' });
      }

      db.run('COMMIT;', () => {
        res.status(201).json({ message: '¡Factura de compra registrada y stocks actualizados con éxito!', facturaId });
      });
    });
  });
});
// Endpoint para crear una nueva categoría
app.post('/api/categorias', (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
  }

  const query = `INSERT INTO categorias (nombre) VALUES (?)`;
  db.run(query, [nombre], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'La categoría ya existe.' });
      }
      return res.status(500).json({ message: 'Error al registrar la categoría.' });
    }
    res.status(201).json({ id: this.lastID, nombre, message: '¡Categoría creada con éxito!' });
  });
});

// === MÓDULO DE CATEGORÍAS (CRUD COMPLETO) ===

// 1. Obtener todas las categorías
app.get('/api/categorias', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY nombre ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener las categorías' });
    }
    res.json(rows);
  });
});

// 2. Crear una nueva categoría
app.post('/api/categorias', (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
  }

  const query = `INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)`;
  db.run(query, [nombre.trim(), descripcion || ''], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'La categoría ya existe' });
      }
      return res.status(500).json({ message: 'Error al guardar la categoría' });
    }
    res.status(201).json({ id: this.lastID, nombre: nombre.trim(), message: 'Categoría creada con éxito' });
  });
});

// 3. Editar una categoría existente
app.put('/api/categorias/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
  }

  const query = `UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?`;
  db.run(query, [nombre.trim(), descripcion || '', id], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Ya existe otra categoría con ese nombre' });
      }
      return res.status(500).json({ message: 'Error al actualizar la categoría' });
    }
    res.json({ message: 'Categoría actualizada correctamente' });
  });
});

// 4. Eliminar una categoría
app.delete('/api/categorias/:id', (req, res) => {
  const { id } = req.params;

  // Verificar si hay productos asignados a esta categoría antes de borrar
  db.get('SELECT COUNT(*) AS count FROM productos WHERE categoria_id = ?', [id], (errCheck, row) => {
    if (errCheck) {
      return res.status(500).json({ message: 'Error al verificar dependencias' });
    }
    if (row && row.count > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar la categoría porque tiene ${row.count} producto(s) asociado(s).` 
      });
    }

    db.run('DELETE FROM categorias WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error al eliminar la categoría' });
      }
      res.json({ message: 'Categoría eliminada con éxito' });
    });
  });
});


// Endpoint 3: Obtener usuarios (Protegido)
app.get('/api/users', verifySupraRole, (req, res) => {
  db.all('SELECT id, nombre, email, rol, creado_en FROM usuarios', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al obtener usuarios.' });
    res.json(rows);
  });
});

// Endpoint 4: Actualizar rol de usuario (Protegido)
app.put('/api/users/:id', verifySupraRole, (req, res) => {
  const { rol } = req.body;
  const { id } = req.params;
  
  db.run('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, id], function (err) {
    if (err) return res.status(400).json({ message: 'Error al cambiar rol.' });
    res.json({ message: 'Rol actualizado correctamente.' });
  });
});

// Endpoint 5: Eliminar usuario (Protegido)
app.delete('/api/users/:id', verifySupraRole, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM usuarios WHERE id = ?', [id], function (err) {
    if (err) return res.status(400).json({ message: 'Error al eliminar usuario.' });
    res.json({ message: 'Usuario eliminado exitosamente.' });
  });
});

// Endpoint para obtener todas las categorías
app.get('/api/categorias', (req, res) => {
  db.all('SELECT * FROM categorias', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener categorías' });
    }
    res.json(rows);
  });
});

// Endpoint para obtener proveedores
app.get('/api/proveedores', (req, res) => {
  db.all('SELECT * FROM proveedores', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener proveedores' });
    }
    res.json(rows);
  });
});

// === MÓDULO DE PRODUCTOS ===

// 1. Obtener todos los productos (trayendo el stock actual mediante un LEFT JOIN)
app.get('/api/products', (req, res) => {
  const query = `
    SELECT p.*, c.nombre AS categoria_nombre, COALESCE(s.cantidad_actual, 0) AS stock 
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN stock s ON p.id = s.producto_id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener productos' });
    }
    res.json(rows);
  });
});

// 2. Añadir un nuevo producto 
app.post('/api/products', (req, res) => {
  const { codigo_barras, nombre, precio_costo, precio_venta, categoria_id, proveedor_id, temporada_alta, stock } = req.body;

  if (!nombre || !codigo_barras) {
    return res.status(400).json({ message: 'El nombre y el código de barras son obligatorios' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const queryProd = `
      INSERT INTO productos (codigo_barras, nombre, precio_costo, precio_venta, categoria_id, proveedor_id, temporada_alta)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(queryProd, [codigo_barras, nombre, precio_costo || 0, precio_venta || 0, categoria_id || null, proveedor_id || null, temporada_alta || 'TODA_TEMP'], function (err) {
      if (err) {
        db.run('ROLLBACK;');
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'El código de barras ya está registrado' });
        }
        return res.status(500).json({ message: 'Error al guardar el producto' });
      }

      const prodId = this.lastID;
      const queryStock = `INSERT INTO stock (producto_id, cantidad_actual) VALUES (?, ?)`;

      db.run(queryStock, [prodId, stock || 0], (errStock) => {
        if (errStock) {
          db.run('ROLLBACK;');
          return res.status(500).json({ message: 'Error al registrar el stock inicial' });
        }

        db.run('COMMIT;', () => {
          res.status(201).json({ id: prodId, message: 'Producto creado con éxito' });
        });
      });
    });
  });
});

// 3. Actualizar un producto
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { codigo_barras, nombre, precio_costo, precio_venta, categoria_id, proveedor_id, temporada_alta, stock } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const queryProd = `
      UPDATE productos
      SET codigo_barras = ?, nombre = ?, precio_costo = ?, precio_venta = ?, categoria_id = ?, proveedor_id = ?, temporada_alta = ?
      WHERE id = ?
    `;

    db.run(queryProd, [codigo_barras, nombre, precio_costo, precio_venta, categoria_id, proveedor_id, temporada_alta, id], (err) => {
      if (err) {
        db.run('ROLLBACK;');
        return res.status(500).json({ message: 'Error al actualizar el producto' });
      }

      const queryStock = `
        INSERT INTO stock (producto_id, cantidad_actual) VALUES (?, ?)
        ON CONFLICT(producto_id) DO UPDATE SET cantidad_actual = ?
      `;

      db.run(queryStock, [id, stock || 0, stock || 0], (errStock) => {
        if (errStock) {
          db.run('ROLLBACK;');
          return res.status(500).json({ message: 'Error al actualizar el stock' });
        }

        db.run('COMMIT;', () => {
          res.json({ message: 'Producto actualizado correctamente' });
        });
      });
    });
  });
});

// 4. Eliminar un producto
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM productos WHERE id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error al eliminar el producto' });
    }
    res.json({ message: 'Producto eliminado correctamente' });
  });
});

// === MÓDULO DE PROVEEDORES (CRUD) ===

app.get('/api/suppliers', (req, res) => {
  db.all('SELECT * FROM proveedores', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener proveedores' });
    }
    res.json(rows);
  });
});

app.post('/api/suppliers', (req, res) => {
  const { nombre, telefono, email } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El nombre del proveedor es obligatorio' });
  }

  const query = `INSERT INTO proveedores (nombre, telefono, email) VALUES (?, ?, ?)`;
  db.run(query, [nombre, telefono || '', email || ''], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error al registrar el proveedor' });
    }
    res.status(201).json({ id: this.lastID, message: 'Proveedor creado con éxito' });
  });
});

app.put('/api/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, email } = req.body;

  const query = `UPDATE proveedores SET nombre = ?, telefono = ?, email = ? WHERE id = ?`;
  db.run(query, [nombre, telefono, email, id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error al actualizar el proveedor' });
    }
    res.json({ message: 'Proveedor actualizado correctamente' });
  });
});

app.delete('/api/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM proveedores WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error al eliminar el proveedor' });
    }
    res.json({ message: 'Proveedor eliminado correctamente' });
  });
});

// === MÓDULO DE HISTORIAL Y COMPRAS ===

// Crear tabla de compras si no existe
db.run(`CREATE TABLE IF NOT EXISTS compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER,
  proveedor_id INTEGER,
  cantidad INTEGER NOT NULL,
  precio_costo_unitario REAL NOT NULL,
  fecha TEXT NOT NULL,
  FOREIGN KEY(producto_id) REFERENCES productos(id),
  FOREIGN KEY(proveedor_id) REFERENCES proveedores(id)
)`);

// 1. Registrar una nueva compra y actualizar el stock sumando a la tabla 'stock'
app.post('/api/compras', (req, res) => {
  const { producto_id, proveedor_id, cantidad, precio_costo_unitario, fecha } = req.body;

  if (!producto_id || !cantidad || !precio_costo_unitario || !fecha) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para registrar la compra.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const queryCompra = `
      INSERT INTO compras (producto_id, proveedor_id, cantidad, precio_costo_unitario, fecha) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(queryCompra, [producto_id, proveedor_id || null, cantidad, precio_costo_unitario, fecha], function(errCompra) {
      if (errCompra) {
        db.run('ROLLBACK;');
        return res.status(500).json({ message: 'Error al registrar la compra en el historial.' });
      }

      db.get(`SELECT cantidad_actual FROM stock WHERE producto_id = ?`, [producto_id], (errGetStock, row) => {
        if (errGetStock) {
          db.run('ROLLBACK;');
          return res.status(500).json({ message: 'Error al consultar el stock actual.' });
        }

        const stockActual = row ? row.cantidad_actual : 0;
        const nuevoStock = Number(stockActual) + Number(cantidad);

        const queryStock = `
          INSERT INTO stock (producto_id, cantidad_actual) VALUES (?, ?)
          ON CONFLICT(producto_id) DO UPDATE SET cantidad_actual = ?
        `;

        db.run(queryStock, [producto_id, nuevoStock, nuevoStock], (errStockUpdate) => {
          if (errStockUpdate) {
            db.run('ROLLBACK;');
            return res.status(500).json({ message: 'Error al actualizar el stock.' });
          }

          db.run('COMMIT;', () => {
            res.status(201).json({ message: '¡Compra registrada y stock actualizado con éxito!' });
          });
        });
      });
    });
  });
});

// 2. Obtener el historial de compras con detalles de producto y proveedor
app.get('/api/compras', (req, res) => {
  const query = `
    SELECT c.id, c.cantidad, c.precio_costo_unitario, c.fecha, 
           p.nombre AS producto_nombre, 
           pr.nombre AS proveedor_nombre 
    FROM compras c
    LEFT JOIN productos p ON c.producto_id = p.id
    LEFT JOIN proveedores pr ON c.proveedor_id = pr.id
    ORDER BY c.fecha DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener el historial de compras.' });
    }
    res.json(rows);
  });
});

// === INICIO DEL SERVIDOR (Siempre al final) ===
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});