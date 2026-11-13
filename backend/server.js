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

// 2. CREACIÓN AUTOMÁTICA DE TODAS LAS TABLAS AL INICIAR (Garantiza arranque desde cero)
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");

  db.run(`CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      email TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_barras TEXT UNIQUE,
      nombre TEXT NOT NULL,
      precio_costo REAL NOT NULL DEFAULT 0,
      precio_venta REAL NOT NULL DEFAULT 0,
      categoria_id INTEGER,
      proveedor_id INTEGER,
      temporada_alta TEXT CHECK(temporada_alta IN ('VERANO', 'INVIERNO', 'TODA_TEMP')) DEFAULT 'TODA_TEMP',
      FOREIGN KEY (categoria_id) REFERENCES categorias(id),
      FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER UNIQUE NOT NULL,
      cantidad_actual INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS atributos_estacionales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      temporada TEXT CHECK(temporada IN ('VERANO', 'INVIERNO', 'REGULAR')) NOT NULL,
      stock_minimo INTEGER NOT NULL DEFAULT 5,
      stock_deseado INTEGER NOT NULL DEFAULT 20,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      UNIQUE(producto_id, temporada)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT CHECK(rol IN ('ADMIN', 'SUPRA')) NOT NULL DEFAULT 'ADMIN',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS facturas_compra (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proveedor_id INTEGER,
      numero_factura TEXT NOT NULL,
      fecha TEXT NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY(proveedor_id) REFERENCES proveedores(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS detalle_compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER,
      producto_id INTEGER,
      cantidad INTEGER NOT NULL,
      precio_costo_unitario REAL NOT NULL,
      FOREIGN KEY(factura_id) REFERENCES facturas_compra(id) ON DELETE CASCADE,
      FOREIGN KEY(producto_id) REFERENCES productos(id)
  )`);

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
});


// Función auxiliar para verificar si una fecha (formato YYYY-MM-DD) pertenece al mes actual
const esDelMesActual = (fechaStr) => {
  if (!fechaStr) return false;
  const [anioFactura, mesFactura] = fechaStr.split('-');
  const fechaActual = new Date();
  const anioActual = fechaActual.getFullYear().toString();
  const mesActual = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
  
  return anioFactura === anioActual && mesFactura === mesActual;
};

// 3. SEGUNDO: Importamos y montamos las rutas modulares
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

// 1. CREAR nueva factura de compra (POST)
app.post('/api/facturas-compra', (req, res) => {
  const { proveedor_id, numero_factura, fecha, items } = req.body;

  if (!numero_factura || !fecha || !items || items.length === 0) {
    return res.status(400).json({ message: 'Faltan datos de la factura o los ítems están vacíos.' });
  }

  // Opcional: evitar también registrar facturas con fecha de meses pasados
  if (!esDelMesActual(fecha)) {
    return res.status(403).json({
      message: 'Acción denegada: Solo se pueden registrar facturas correspondientes al mes actual.'
    });
  }

  const totalFactura = items.reduce(
    (acc, item) => acc + Number(item.cantidad) * Number(item.precio_costo_unitario),
    0
  );

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const queryCabecera = `INSERT INTO facturas_compra (proveedor_id, numero_factura, fecha, total) VALUES (?, ?, ?, ?)`;

    db.run(queryCabecera, [proveedor_id || null, numero_factura, fecha, totalFactura], function (errCabecera) {
      if (errCabecera) {
        db.run('ROLLBACK;');
        return res.status(500).json({ message: 'Error al registrar la cabecera de la factura.' });
      }

      const facturaId = this.lastID;
      let erroresEnItems = false;

      items.forEach((item) => {
        if (erroresEnItems) return;

        const queryDetalle = `INSERT INTO detalle_compras (factura_id, producto_id, cantidad, precio_costo_unitario) VALUES (?, ?, ?, ?)`;
        db.run(queryDetalle, [facturaId, item.producto_id, item.cantidad, item.precio_costo_unitario], (errDetalle) => {
          if (errDetalle) erroresEnItems = true;
        });

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

// 2. EDITAR factura de compra existente (PUT - Solo mes actual y recalcula stock)
app.put('/api/facturas-compra/:id', (req, res) => {
  const { id } = req.params;
  const { proveedor_id, numero_factura, fecha, items } = req.body;

  if (!numero_factura || !fecha || !items || items.length === 0) {
    return res.status(400).json({ message: 'Faltan datos de la factura o los ítems están vacíos.' });
  }

  db.get('SELECT fecha FROM facturas_compra WHERE id = ?', [id], (err, factura) => {
    if (err || !factura) {
      return res.status(404).json({ message: 'Factura no encontrada.' });
    }

    // Validar que tanto la fecha original como la nueva pertenezcan al mes actual
    if (!esDelMesActual(factura.fecha) || !esDelMesActual(fecha)) {
      return res.status(403).json({
        message: 'Acción denegada: No se pueden modificar facturas de meses anteriores por motivos de seguridad y auditoría.'
      });
    }

    // Consultar ítems anteriores para descontar el stock previo antes de aplicar el nuevo
    db.all('SELECT producto_id, cantidad FROM detalle_compras WHERE factura_id = ?', [id], (errDet, oldItems) => {
      if (errDet) {
        return res.status(500).json({ message: 'Error al leer los ítems anteriores de la factura.' });
      }

      const totalFactura = items.reduce(
        (acc, item) => acc + Number(item.cantidad) * Number(item.precio_costo_unitario),
        0
      );

      db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        // A. Revertir stock de los ítems anteriores
        oldItems.forEach((old) => {
          db.run(
            'UPDATE stock SET cantidad_actual = MAX(0, cantidad_actual - ?) WHERE producto_id = ?',
            [old.cantidad, old.producto_id]
          );
        });

        // B. Eliminar detalles anteriores
        db.run('DELETE FROM detalle_compras WHERE factura_id = ?', [id]);

        // C. Actualizar cabecera de la factura
        db.run(
          'UPDATE facturas_compra SET proveedor_id = ?, numero_factura = ?, fecha = ?, total = ? WHERE id = ?',
          [proveedor_id || null, numero_factura, fecha, totalFactura, id]
        );

        // D. Insertar nuevos ítems y sumar nuevo stock
        items.forEach((item) => {
          db.run(
            'INSERT INTO detalle_compras (factura_id, producto_id, cantidad, precio_costo_unitario) VALUES (?, ?, ?, ?)',
            [id, item.producto_id, item.cantidad, item.precio_costo_unitario]
          );

          db.run(
            `INSERT INTO stock (producto_id, cantidad_actual) VALUES (?, ?)
             ON CONFLICT(producto_id) DO UPDATE SET cantidad_actual = cantidad_actual + ?`,
            [item.producto_id, item.cantidad, item.cantidad]
          );
        });

        db.run('COMMIT;', (errCommit) => {
          if (errCommit) {
            db.run('ROLLBACK;');
            return res.status(500).json({ message: 'Error al guardar los cambios de la factura.' });
          }
          res.json({ message: '¡Factura actualizada y stock recalculado con éxito!' });
        });
      });
    });
  });
});

// 3. ELIMINAR factura de compra (DELETE - Solo mes actual y revierte stock)
app.delete('/api/facturas-compra/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT fecha FROM facturas_compra WHERE id = ?', [id], (err, factura) => {
    if (err || !factura) {
      return res.status(404).json({ message: 'Factura no encontrada.' });
    }

    if (!esDelMesActual(factura.fecha)) {
      return res.status(403).json({
        message: 'Acción denegada: No se pueden eliminar facturas de meses anteriores.'
      });
    }

    db.all('SELECT producto_id, cantidad FROM detalle_compras WHERE factura_id = ?', [id], (errDet, oldItems) => {
      if (errDet) {
        return res.status(500).json({ message: 'Error al consultar los ítems de la factura.' });
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        oldItems.forEach((old) => {
          db.run(
            'UPDATE stock SET cantidad_actual = MAX(0, cantidad_actual - ?) WHERE producto_id = ?',
            [old.cantidad, old.producto_id]
          );
        });

        db.run('DELETE FROM facturas_compra WHERE id = ?', [id]);

        db.run('COMMIT;', (errCommit) => {
          if (errCommit) {
            db.run('ROLLBACK;');
            return res.status(500).json({ message: 'Error al eliminar la factura.' });
          }
          res.json({ message: 'Factura eliminada y stock revertido correctamente.' });
        });
      });
    });
  });
});

// Endpoint para crear una nueva categoría
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

// 1. Obtener todas las categorías
app.get('/api/categorias', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY nombre ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener las categorías' });
    }
    res.json(rows);
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

// Endpoint para obtener proveedores
app.get('/api/proveedores', (req, res) => {
  db.all('SELECT * FROM proveedores', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener proveedores' });
    }
    res.json(rows);
  });
});

// Función para determinar la estación actual (Hemisferio Sur)
const obtenerEstacionServidor = () => {
  const mes = new Date().getMonth() + 1; // 1 a 12
  if (mes === 12 || mes === 1 || mes === 2) return 'VERANO';
  if (mes >= 6 && mes <= 8) return 'INVIERNO';
  return 'REGULAR';
};

// === MÓDULO DE PRODUCTOS CON ALERTAS ESTACIONALES ===

// 1. Obtener todos los productos con su umbral dinámico
app.get('/api/products', (req, res) => {
  const estacionActual = obtenerEstacionServidor();

  const query = `
    SELECT 
      p.*, 
      c.nombre AS categoria_nombre, 
      COALESCE(s.cantidad_actual, 0) AS stock,
      COALESCE(
        ae_actual.stock_minimo,
        ae_alta.stock_minimo,
        CASE WHEN p.temporada_alta = ? THEN 15 ELSE 5 END
      ) AS stock_minimo_vigente,
      COALESCE(ae_actual.stock_deseado, ae_alta.stock_deseado, 20) AS stock_deseado_vigente,
      ? AS estacion_actual
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN stock s ON p.id = s.producto_id
    LEFT JOIN atributos_estacionales ae_actual 
      ON p.id = ae_actual.producto_id AND ae_actual.temporada = ?
    LEFT JOIN atributos_estacionales ae_alta 
      ON p.id = ae_alta.producto_id AND ae_alta.temporada = CASE WHEN p.temporada_alta = 'TODA_TEMP' THEN 'REGULAR' ELSE p.temporada_alta END
  `;

  db.all(query, [estacionActual, estacionActual, estacionActual], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener productos' });
    }
    res.json(rows);
  });
});

// 2. Añadir un nuevo producto y registrar sus umbrales estacionales
app.post('/api/products', (req, res) => {
  const {
    codigo_barras,
    nombre,
    precio_costo,
    precio_venta,
    categoria_id,
    proveedor_id,
    temporada_alta,
    stock,
    stock_minimo,
    stock_deseado
  } = req.body;

  if (!nombre || !codigo_barras) {
    return res.status(400).json({ message: 'El nombre y el código de barras son obligatorios' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');

    const queryProd = `
      INSERT INTO productos (codigo_barras, nombre, precio_costo, precio_venta, categoria_id, proveedor_id, temporada_alta)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      queryProd,
      [codigo_barras, nombre, precio_costo || 0, precio_venta || 0, categoria_id || null, proveedor_id || null, temporada_alta || 'TODA_TEMP'],
      function (err) {
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

          const tempObjetivo = temporada_alta === 'TODA_TEMP' ? 'REGULAR' : (temporada_alta || 'REGULAR');
          const minVal = stock_minimo !== undefined && stock_minimo !== '' ? Number(stock_minimo) : (tempObjetivo !== 'REGULAR' ? 15 : 5);
          const desVal = stock_deseado !== undefined && stock_deseado !== '' ? Number(stock_deseado) : 20;

          const queryAttr = `
            INSERT INTO atributos_estacionales (producto_id, temporada, stock_minimo, stock_deseado)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(producto_id, temporada) DO UPDATE SET stock_minimo = ?, stock_deseado = ?
          `;

          db.run(queryAttr, [prodId, tempObjetivo, minVal, desVal, minVal, desVal], (errAttr) => {
            if (errAttr) {
              db.run('ROLLBACK;');
              return res.status(500).json({ message: 'Error al configurar alertas estacionales' });
            }

            db.run('COMMIT;', () => {
              res.status(201).json({ id: prodId, message: 'Producto y alerta estacional creados con éxito' });
            });
          });
        });
      }
    );
  });
});

// 3. Actualizar un producto y su umbral estacional vigente
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const {
    codigo_barras,
    nombre,
    precio_costo,
    precio_venta,
    categoria_id,
    proveedor_id,
    temporada_alta,
    stock,
    stock_minimo,
    stock_deseado
  } = req.body;

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

        if (stock_minimo !== undefined && stock_minimo !== '') {
          const tempObjetivo = temporada_alta === 'TODA_TEMP' ? 'REGULAR' : (temporada_alta || 'REGULAR');
          const minVal = Number(stock_minimo);
          const desVal = stock_deseado !== undefined && stock_deseado !== '' ? Number(stock_deseado) : 20;

          const queryAttr = `
            INSERT INTO atributos_estacionales (producto_id, temporada, stock_minimo, stock_deseado)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(producto_id, temporada) DO UPDATE SET stock_minimo = ?, stock_deseado = ?
          `;

          db.run(queryAttr, [id, tempObjetivo, minVal, desVal, minVal, desVal], (errAttr) => {
            if (errAttr) {
              db.run('ROLLBACK;');
              return res.status(500).json({ message: 'Error al actualizar alerta estacional' });
            }

            db.run('COMMIT;', () => {
              res.json({ message: 'Producto y umbral estacional actualizados correctamente' });
            });
          });
        } else {
          db.run('COMMIT;', () => {
            res.json({ message: 'Producto actualizado correctamente' });
          });
        }
      });
    });
  });
});

// 4. Eliminar un producto
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM productos WHERE id = ?', [id], function (err) {
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

app.get('/api/compras', (req, res) => {
  const query = `
    SELECT d.id, d.cantidad, d.precio_costo_unitario, f.fecha, 
           p.nombre AS producto_nombre, 
           pr.nombre AS proveedor_nombre 
    FROM detalle_compras d
    JOIN facturas_compra f ON d.factura_id = f.id
    LEFT JOIN productos p ON d.producto_id = p.id
    LEFT JOIN proveedores pr ON f.proveedor_id = pr.id
    ORDER BY f.fecha DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener el historial de compras.' });
    }
    res.json(rows);
  });
});

// 1. Obtener todas las facturas de compra
app.get('/api/facturas-compra', (req, res) => {
  const query = `
    SELECT f.*, p.nombre AS proveedor_nombre 
    FROM facturas_compra f
    LEFT JOIN proveedores p ON f.proveedor_id = p.id
    ORDER BY f.fecha DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al obtener las facturas.' });
    res.json(rows);
  });
});

// 2. Obtener los ítems/detalles de una factura específica
app.get('/api/facturas-compra/:id/detalles', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT d.*, p.nombre AS producto_nombre
    FROM detalle_compras d
    LEFT JOIN productos p ON d.producto_id = p.id
    WHERE d.factura_id = ?
  `;
  db.all(query, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error al obtener el detalle de la factura.' });
    res.json(rows);
  });
});




// === INICIO DEL SERVIDOR (Siempre al final) ===
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});