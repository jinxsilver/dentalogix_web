const db = require('./db');
const bcrypt = require('bcryptjs');

module.exports = {
  getAll() {
    return db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all();
  },

  getById(id) {
    return db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(id);
  },

  getByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  getByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  authenticate(username, password) {
    const user = this.getByUsername(username);
    if (!user) return null;
    
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return null;
    
    // Don't return the password
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  create(data) {
    const hashedPassword = bcrypt.hashSync(data.password, 10);
    return db.prepare(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run(data.username, data.email, hashedPassword, data.role || 'editor');
  },

  update(id, data) {
    if (data.password) {
      const hashedPassword = bcrypt.hashSync(data.password, 10);
      return db.prepare(`
        UPDATE users SET username = ?, email = ?, password = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(data.username, data.email, hashedPassword, data.role, id);
    }
    return db.prepare(`
      UPDATE users SET username = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.username, data.email, data.role, id);
  },

  updatePassword(id, password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    return db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, id);
  },

  delete(id) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
};
