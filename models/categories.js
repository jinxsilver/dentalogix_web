const db = require('./db');
const slugify = require('slugify');

module.exports = {
  getAll() {
    return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  },

  create(data) {
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    return db.prepare(`
      INSERT INTO categories (name, slug, description)
      VALUES (?, ?, ?)
    `).run(data.name, slug, data.description || '');
  },

  update(id, data) {
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    return db.prepare(`
      UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?
    `).run(data.name, slug, data.description || '', id);
  },

  delete(id) {
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
};
