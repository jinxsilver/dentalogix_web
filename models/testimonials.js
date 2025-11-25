const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare(`
      SELECT t.*, s.title as service_name
      FROM testimonials t
      LEFT JOIN services s ON t.service_id = s.id
      ORDER BY t.created_at DESC
    `).all();
  },

  getPublished() {
    return db.prepare(`
      SELECT t.*, s.title as service_name
      FROM testimonials t
      LEFT JOIN services s ON t.service_id = s.id
      WHERE t.status = 'published'
      ORDER BY t.created_at DESC
    `).all();
  },

  getFeatured() {
    return db.prepare(`
      SELECT t.*, s.title as service_name
      FROM testimonials t
      LEFT JOIN services s ON t.service_id = s.id
      WHERE t.status = 'published' AND t.featured = 1
      ORDER BY t.created_at DESC
    `).all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM testimonials WHERE id = ?').get(id);
  },

  create(data) {
    return db.prepare(`
      INSERT INTO testimonials (patient_name, patient_photo, content, rating, service_id, featured, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.patient_name,
      data.patient_photo || null,
      data.content,
      data.rating || 5,
      data.service_id || null,
      data.featured ? 1 : 0,
      data.status || 'published'
    );
  },

  update(id, data) {
    return db.prepare(`
      UPDATE testimonials SET
        patient_name = ?,
        patient_photo = ?,
        content = ?,
        rating = ?,
        service_id = ?,
        featured = ?,
        status = ?
      WHERE id = ?
    `).run(
      data.patient_name,
      data.patient_photo || null,
      data.content,
      data.rating || 5,
      data.service_id || null,
      data.featured ? 1 : 0,
      data.status || 'published',
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
  }
};
