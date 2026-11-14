const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'kiosco.db'));

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");
  db.run("BEGIN TRANSACTION;");

  db.run(`
    INSERT INTO facturas_compra (proveedor_id, numero_factura, fecha, total)
    VALUES 
      ((SELECT id FROM proveedores LIMIT 1), 'A-0001-0000102', '2026-08-14', 450000),
      ((SELECT id FROM proveedores LIMIT 1), 'A-0001-0000215', '2026-09-20', 820000),
      ((SELECT id FROM proveedores LIMIT 1), 'B-0002-0000389', '2026-10-10', 610000);
  `);

  db.run(`
    INSERT INTO detalle_compras (factura_id, producto_id, cantidad, precio_costo_unitario)
    VALUES 
      ((SELECT id FROM facturas_compra WHERE numero_factura = 'A-0001-0000102'), (SELECT id FROM productos LIMIT 1), 150, 3000),
      ((SELECT id FROM facturas_compra WHERE numero_factura = 'A-0001-0000215'), (SELECT id FROM productos LIMIT 1 OFFSET 1), 410, 2000),
      ((SELECT id FROM facturas_compra WHERE numero_factura = 'B-0002-0000389'), (SELECT id FROM productos LIMIT 1), 200, 3050);
  `);

  db.run("COMMIT;", (err) => {
    if (err) console.error("Error al insertar:", err.message);
    else console.log("¡Facturas históricas cargadas con éxito!");
    db.close();
  });


  console.log('¡Carga de datos dummy finalizada!');
});

db.close();