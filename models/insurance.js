const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare('SELECT * FROM insurance_providers ORDER BY display_order ASC, name ASC').all();
  },

  getPublished() {
    return db.prepare('SELECT * FROM insurance_providers WHERE status = ? ORDER BY display_order ASC, name ASC').all('published');
  },

  getById(id) {
    return db.prepare('SELECT * FROM insurance_providers WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO insurance_providers (name, logo, website_url, display_order, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.name,
      data.logo || null,
      data.website_url || null,
      data.display_order || 0,
      data.status || 'published'
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE insurance_providers SET
        name = ?,
        logo = ?,
        website_url = ?,
        display_order = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.name,
      data.logo || null,
      data.website_url || null,
      data.display_order || 0,
      data.status || 'published',
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM insurance_providers WHERE id = ?').run(id);
  },

  updateOrder(id, order) {
    return db.prepare('UPDATE insurance_providers SET display_order = ? WHERE id = ?').run(order, id);
  }
};
