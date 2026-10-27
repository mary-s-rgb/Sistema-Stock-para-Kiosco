const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (db) => {
  // Endpoint para verificar si el correo existe
  router.post('/recover-password', (req, res) => {
    const { email } = req.body;
    db.get('SELECT id, email FROM usuarios WHERE email = ?', [email], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ message: 'No existe una cuenta asociada a este correo.' });
      }
      res.json({ message: 'Usuario verificado correctamente.', userId: user.id });
    });
  });

  // Endpoint para actualizar la contraseña con hash seguro
  router.put('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.run(
        'UPDATE usuarios SET password_hash = ? WHERE email = ?',
        [hashedPassword, email],
        function (err) {
          if (err || this.changes === 0) {
            return res.status(400).json({ message: 'Error al actualizar la contraseña.' });
          }
          res.json({ message: 'Contraseña actualizada con éxito.' });
        }
      );
    } catch (error) {
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  });

  return router;
};