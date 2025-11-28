const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare(`
      SELECT o.*, b.brand_name as brandscript_name
      FROM offers o
      LEFT JOIN brandscripts b ON o.brandscript_id = b.id
      ORDER BY o.created_at DESC
    `).all();
  },

  getPublished() {
    return db.prepare(`
      SELECT * FROM offers
      WHERE status = 'published'
      AND (start_date IS NULL OR start_date <= date('now'))
      AND (end_date IS NULL OR end_date >= date('now'))
      ORDER BY created_at DESC
    `).all();
  },

  getActive() {
    return db.prepare(`
      SELECT * FROM offers
      WHERE status = 'published'
      AND (start_date IS NULL OR start_date <= date('now'))
      AND (end_date IS NULL OR end_date >= date('now'))
      ORDER BY created_at DESC
    `).all();
  },

  getByCategory(category) {
    return db.prepare(`
      SELECT * FROM offers
      WHERE category = ? AND status = 'published'
      AND (start_date IS NULL OR start_date <= date('now'))
      AND (end_date IS NULL OR end_date >= date('now'))
      ORDER BY created_at DESC
    `).all(category);
  },

  getById(id) {
    return db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  },

  getBySlug(slug) {
    return db.prepare('SELECT * FROM offers WHERE slug = ?').get(slug);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO offers (
        title, slug, headline, subheadline, description, offer_details, terms,
        featured_image, background_image, cta_text, cta_color,
        form_headline, form_fields, thank_you_message, template, category,
        start_date, end_date, meta_title, meta_description, meta_keywords, og_image, status,
        brandscript_id, show_stakes_section, show_guide_section, show_plan_section,
        show_success_section, show_testimonials_section
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.title,
      data.slug,
      data.headline || null,
      data.subheadline || null,
      data.description || null,
      data.offer_details || null,
      data.terms || null,
      data.featured_image || null,
      data.background_image || null,
      data.cta_text || 'Claim This Offer',
      data.cta_color || '#0077B6',
      data.form_headline || 'Get Started Today',
      data.form_fields || 'name,email,phone',
      data.thank_you_message || 'Thank you! We will contact you shortly.',
      data.template || 'standard',
      data.category || 'general',
      data.start_date || null,
      data.end_date || null,
      data.meta_title || null,
      data.meta_description || null,
      data.meta_keywords || null,
      data.og_image || null,
      data.status || 'draft',
      data.brandscript_id || null,
      data.show_stakes_section ? 1 : 0,
      data.show_guide_section ? 1 : 0,
      data.show_plan_section ? 1 : 0,
      data.show_success_section ? 1 : 0,
      data.show_testimonials_section ? 1 : 0
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE offers SET
        title = ?, slug = ?, headline = ?, subheadline = ?, description = ?,
        offer_details = ?, terms = ?, featured_image = ?, background_image = ?,
        cta_text = ?, cta_color = ?, form_headline = ?, form_fields = ?,
        thank_you_message = ?, template = ?, category = ?,
        start_date = ?, end_date = ?, meta_title = ?, meta_description = ?,
        meta_keywords = ?, og_image = ?, status = ?,
        brandscript_id = ?, show_stakes_section = ?, show_guide_section = ?,
        show_plan_section = ?, show_success_section = ?, show_testimonials_section = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.title,
      data.slug,
      data.headline || null,
      data.subheadline || null,
      data.description || null,
      data.offer_details || null,
      data.terms || null,
      data.featured_image || null,
      data.background_image || null,
      data.cta_text || 'Claim This Offer',
      data.cta_color || '#0077B6',
      data.form_headline || 'Get Started Today',
      data.form_fields || 'name,email,phone',
      data.thank_you_message || 'Thank you! We will contact you shortly.',
      data.template || 'standard',
      data.category || 'general',
      data.start_date || null,
      data.end_date || null,
      data.meta_title || null,
      data.meta_description || null,
      data.meta_keywords || null,
      data.og_image || null,
      data.status || 'draft',
      data.brandscript_id || null,
      data.show_stakes_section ? 1 : 0,
      data.show_guide_section ? 1 : 0,
      data.show_plan_section ? 1 : 0,
      data.show_success_section ? 1 : 0,
      data.show_testimonials_section ? 1 : 0,
      id
    );
  },

  incrementViews(id) {
    return db.prepare('UPDATE offers SET views = views + 1 WHERE id = ?').run(id);
  },

  incrementConversions(id) {
    return db.prepare('UPDATE offers SET conversions = conversions + 1 WHERE id = ?').run(id);
  },

  delete(id) {
    return db.prepare('DELETE FROM offers WHERE id = ?').run(id);
  },

  getStats() {
    return db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(views) as total_views,
        SUM(conversions) as total_conversions
      FROM offers
    `).get();
  }
};
