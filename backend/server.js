const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'clave_secreta_kiosco';
const recoverPasswordRoutes = require('./recover-password');

app.use(cors());
app.use(express.json());
app.use('/api', recoverPasswordRoutes(db));

const db = new sqlite3.Database(
  path.resolve(__dirname, 'kiosco.db')
);

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

app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});