const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare('SELECT * FROM team ORDER BY sort_order ASC').all();
  },

  getPublished() {
    return db.prepare(`
      SELECT * FROM team WHERE status = 'published' ORDER BY sort_order ASC
    `).all();
  },

  getByCategory(category) {
    return db.prepare(`
      SELECT * FROM team WHERE status = 'published' AND category = ? ORDER BY sort_order ASC
    `).all(category);
  },

  getPublishedGrouped() {
    const all = db.prepare(`
      SELECT * FROM team WHERE status = 'published' ORDER BY sort_order ASC
    `).all();

    return {
      dentists: all.filter(m => m.category === 'dentist'),
      executives: all.filter(m => m.category === 'executive'),
      hygienists: all.filter(m => m.category === 'hygienist'),
      staff: all.filter(m => m.category === 'staff' || !m.category)
    };
  },

  getById(id) {
    return db.prepare('SELECT * FROM team WHERE id = ?').get(id);
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM team WHERE slug = ? AND status = ?').get(slug, 'published');
  },

  create(data) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return db.prepare(`
      INSERT INTO team (name, title, bio, full_bio, photo, email, specialties, credentials, category, bio_page_enabled, slug, sort_order, status, linkedin_url, undergrad_school, undergrad_degree, undergrad_logo, grad_school, grad_degree, grad_logo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name,
      data.title || '',
      data.bio || '',
      data.full_bio || '',
      data.photo || null,
      data.email || '',
      data.specialties || '',
      data.credentials || '',
      data.category || 'staff',
      data.bio_page_enabled ? 1 : 0,
      slug,
      data.sort_order || 0,
      data.status || 'published',
      data.linkedin_url || '',
      data.undergrad_school || '',
      data.undergrad_degree || '',
      data.undergrad_logo || '',
      data.grad_school || '',
      data.grad_degree || '',
      data.grad_logo || ''
    );
  },

  update(id, data) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return db.prepare(`
      UPDATE team SET
        name = ?,
        title = ?,
        bio = ?,
        full_bio = ?,
        photo = ?,
        email = ?,
        specialties = ?,
        credentials = ?,
        category = ?,
        bio_page_enabled = ?,
        slug = ?,
        sort_order = ?,
        status = ?,
        linkedin_url = ?,
        undergrad_school = ?,
        undergrad_degree = ?,
        undergrad_logo = ?,
        grad_school = ?,
        grad_degree = ?,
        grad_logo = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name,
      data.title || '',
      data.bio || '',
      data.full_bio || '',
      data.photo || null,
      data.email || '',
      data.specialties || '',
      data.credentials || '',
      data.category || 'staff',
      data.bio_page_enabled ? 1 : 0,
      slug,
      data.sort_order || 0,
      data.status || 'published',
      data.linkedin_url || '',
      data.undergrad_school || '',
      data.undergrad_degree || '',
      data.undergrad_logo || '',
      data.grad_school || '',
      data.grad_degree || '',
      data.grad_logo || '',
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM team WHERE id = ?').run(id);
  }
};
