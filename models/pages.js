const db = require('./db');
const slugify = require('slugify');

module.exports = {
  getAll() {
    return db.prepare(`
      SELECT * FROM pages ORDER BY sort_order ASC
    `).all();
  },

  getNavPages() {
    return db.prepare(`
      SELECT id, title, slug FROM pages 
      WHERE show_in_nav = 1 AND status = 'published'
      ORDER BY sort_order ASC
    `).all();
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug);
  },

  getById(id) {
    return db.prepare('SELECT * FROM pages WHERE id = ?').get(id);
  },

  create(data) {
    const slug = data.slug || slugify(data.title, { lower: true, strict: true });
    return db.prepare(`
      INSERT INTO pages (title, slug, content, meta_description, meta_keywords, hero_image, template, status, sort_order, show_in_nav)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title,
      slug,
      data.content || '',
      data.meta_description || '',
      data.meta_keywords || '',
      data.hero_image || null,
      data.template || 'default',
      data.status || 'published',
      data.sort_order || 0,
      data.show_in_nav ? 1 : 0
    );
  },

  update(id, data) {
    const slug = data.slug || slugify(data.title, { lower: true, strict: true });
    return db.prepare(`
      UPDATE pages SET
        title = ?,
        slug = ?,
        content = ?,
        meta_description = ?,
        meta_keywords = ?,
        hero_image = ?,
        template = ?,
        status = ?,
        sort_order = ?,
        show_in_nav = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title,
      slug,
      data.content || '',
      data.meta_description || '',
      data.meta_keywords || '',
      data.hero_image || null,
      data.template || 'default',
      data.status || 'published',
      data.sort_order || 0,
      data.show_in_nav ? 1 : 0,
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM pages WHERE id = ?').run(id);
  }
};
