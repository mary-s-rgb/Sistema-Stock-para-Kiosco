const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'kiosco.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");

  console.log('Insertando datos de prueba...');

  // 1. Insertar Categorías
  db.run(`INSERT OR IGNORE INTO categorias (nombre) VALUES ('Bebidas'), ('Infusiones')`);

  // 2. Insertar Proveedor
  db.run(`INSERT OR IGNORE INTO proveedores (nombre, telefono, email) VALUES ('Distribuidora Concordia', '3451234567', 'ventas@distconcordia.com')`);

  // 3. Insertar Producto (Coca Cola 500ml - Verano)
  db.run(`
    INSERT OR IGNORE INTO productos (codigo_barras, nombre, precio_costo, precio_venta, categoria_id, proveedor_id, temporada_alta)
    VALUES ('779123456789', 'Coca Cola 500ml', 800.0, 1200.0, 1, 1, 'VERANO')
  `, function(err) {
    if (err) return console.error(err.message);
    const prodId = this.lastID;

    if (prodId) {
      // Stock actual
      db.run(`INSERT INTO stock (producto_id, cantidad_actual) VALUES (${prodId}, 15)`);
      
      // Reglas estacionales para el producto
      db.run(`INSERT INTO atributos_estacionales (producto_id, temporada, stock_minimo, stock_deseado) VALUES (${prodId}, 'VERANO', 24, 60)`);
      db.run(`INSERT INTO atributos_estacionales (producto_id, temporada, stock_minimo, stock_deseado) VALUES (${prodId}, 'INVIERNO', 6, 20)`);
    }
  });

  console.log('¡Carga de datos dummy finalizada!');
});

db.close();