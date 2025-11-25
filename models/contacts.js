const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
  },

  getUnread() {
    return db.prepare('SELECT * FROM contacts WHERE read = 0 ORDER BY created_at DESC').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM contacts').get().count;
  },

  countUnread() {
    return db.prepare('SELECT COUNT(*) as count FROM contacts WHERE read = 0').get().count;
  },

  create(data) {
    return db.prepare(`
      INSERT INTO contacts (name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.name, data.email, data.phone || '', data.subject || '', data.message);
  },

  markRead(id) {
    return db.prepare('UPDATE contacts SET read = 1 WHERE id = ?').run(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  }
};
