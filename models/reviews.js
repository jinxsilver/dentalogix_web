const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare('SELECT * FROM reviews ORDER BY review_date DESC, created_at DESC').all();
  },

  getPublished() {
    return db.prepare('SELECT * FROM reviews WHERE status = ? ORDER BY review_date DESC, created_at DESC').all('published');
  },

  getFeatured() {
    return db.prepare('SELECT * FROM reviews WHERE status = ? AND featured = 1 ORDER BY review_date DESC, created_at DESC').all('published');
  },

  getRecent(limit = 5) {
    return db.prepare('SELECT * FROM reviews WHERE status = ? ORDER BY created_at DESC LIMIT ?').all('published', limit);
  },

  getById(id) {
    return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  },

  getBySource(source) {
    return db.prepare('SELECT * FROM reviews WHERE source = ? ORDER BY review_date DESC').all(source);
  },

  getStats() {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        AVG(rating) as average_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews WHERE status = 'published'
    `).get();
    return stats;
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO reviews (reviewer_name, reviewer_photo, content, rating, source, source_url, review_date, featured, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.reviewer_name,
      data.reviewer_photo || null,
      data.content,
      data.rating || 5,
      data.source || 'google',
      data.source_url || null,
      data.review_date || null,
      data.featured ? 1 : 0,
      data.status || 'published'
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE reviews SET
        reviewer_name = ?,
        reviewer_photo = ?,
        content = ?,
        rating = ?,
        source = ?,
        source_url = ?,
        review_date = ?,
        featured = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.reviewer_name,
      data.reviewer_photo || null,
      data.content,
      data.rating || 5,
      data.source || 'google',
      data.source_url || null,
      data.review_date || null,
      data.featured ? 1 : 0,
      data.status || 'published',
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  },

  getCountBySource() {
    return db.prepare(`
      SELECT source, COUNT(*) as count
      FROM reviews
      WHERE status = 'published'
      GROUP BY source
    `).all();
  }
};
