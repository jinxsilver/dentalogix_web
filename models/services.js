const db = require('./db');
const slugify = require('slugify');

module.exports = {
  getAll() {
    return db.prepare('SELECT * FROM services ORDER BY sort_order ASC').all();
  },

  getPublished() {
    return db.prepare(`
      SELECT * FROM services WHERE status = 'published' ORDER BY sort_order ASC
    `).all();
  },

  getFeatured() {
    return db.prepare(`
      SELECT * FROM services WHERE status = 'published' AND featured = 1 ORDER BY sort_order ASC
    `).all();
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM services WHERE slug = ?').get(slug);
  },

  getById(id) {
    return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  },

  create(data) {
    const slug = data.slug || slugify(data.title, { lower: true, strict: true });
    return db.prepare(`
      INSERT INTO services (title, slug, short_description, full_description, icon, image, price_range, sort_order, featured, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title,
      slug,
      data.short_description || '',
      data.full_description || '',
      data.icon || '',
      data.image || null,
      data.price_range || '',
      data.sort_order || 0,
      data.featured ? 1 : 0,
      data.status || 'published'
    );
  },

  update(id, data) {
    const slug = data.slug || slugify(data.title, { lower: true, strict: true });
    return db.prepare(`
      UPDATE services SET
        title = ?,
        slug = ?,
        short_description = ?,
        full_description = ?,
        icon = ?,
        image = ?,
        price_range = ?,
        sort_order = ?,
        featured = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title,
      slug,
      data.short_description || '',
      data.full_description || '',
      data.icon || '',
      data.image || null,
      data.price_range || '',
      data.sort_order || 0,
      data.featured ? 1 : 0,
      data.status || 'published',
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM services WHERE id = ?').run(id);
  }
};
