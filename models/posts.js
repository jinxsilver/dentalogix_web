const db = require('./db');
const slugify = require('slugify');

module.exports = {
  getAll() {
    return db.prepare(`
      SELECT p.*, u.username as author_name, c.name as category_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `).all();
  },

  getPublished(limit = 10, offset = 0) {
    return db.prepare(`
      SELECT p.*, u.username as author_name, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  getBySlug(slug) {
    return db.prepare(`
      SELECT p.*, u.username as author_name, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `).get(slug);
  },

  getById(id) {
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  },

  getByCategory(categorySlug, limit = 10) {
    return db.prepare(`
      SELECT p.*, u.username as author_name, c.name as category_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE c.slug = ? AND p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ?
    `).all(categorySlug, limit);
  },

  getRecent(limit = 3) {
    return db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
      ORDER BY p.published_at DESC
      LIMIT ?
    `).all(limit);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as count FROM posts WHERE status = ?').get('published').count;
  },

  create(data) {
    const slug = data.slug || slugify(data.title, { lower: true, strict: true });
    const publishedAt = data.status === 'published' ? new Date().toISOString() : null;
    
    return db.prepare(`
      INSERT INTO posts (title, slug, excerpt, content, featured_image, author_id, category_id, meta_description, meta_keywords, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title,
      slug,
      data.excerpt || '',
      data.content || '',
      data.featured_image || null,
      data.author_id,
      data.category_id || null,
      data.meta_description || '',
      data.meta_keywords || '',
      data.status || 'draft',
      publishedAt
    );
  },

  update(id, data) {
    const slug = data.slug || slugify(data.title, { lower: true, strict: true });
    const existing = this.getById(id);
    let publishedAt = existing.published_at;
    
    if (data.status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    return db.prepare(`
      UPDATE posts SET
        title = ?,
        slug = ?,
        excerpt = ?,
        content = ?,
        featured_image = ?,
        category_id = ?,
        meta_description = ?,
        meta_keywords = ?,
        status = ?,
        published_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.title,
      slug,
      data.excerpt || '',
      data.content || '',
      data.featured_image || null,
      data.category_id || null,
      data.meta_description || '',
      data.meta_keywords || '',
      data.status || 'draft',
      publishedAt,
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  }
};
