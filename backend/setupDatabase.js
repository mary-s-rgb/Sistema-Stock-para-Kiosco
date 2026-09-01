const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crea o abre el archivo de la base de datos local llamada kiosco.db
const dbPath = path.resolve(__dirname, 'kiosco.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite (kiosco.db).');
  }
});

// Definición de las tablas (Script DDL)
const sqlScript = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT
  );

  CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      email TEXT
  );

  CREATE TABLE IF NOT EXISTS productos (
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
  );

  CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER UNIQUE NOT NULL,
      cantidad_actual INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS atributos_estacionales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      temporada TEXT CHECK(temporada IN ('VERANO', 'INVIERNO', 'REGULAR')) NOT NULL,
      stock_minimo INTEGER NOT NULL DEFAULT 5,
      stock_deseado INTEGER NOT NULL DEFAULT 20,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
      UNIQUE(producto_id, temporada)
  );
`;

// Ejecución del script
db.exec(sqlScript, (err) => {
  if (err) {
    console.error('Error al crear las tablas:', err.message);
  } else {
    console.log('¡Tablas creadas y configuradas exitosamente!');
  }
  db.close();
});