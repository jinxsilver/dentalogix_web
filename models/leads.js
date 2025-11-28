const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare(`
      SELECT l.*, o.title as offer_title
      FROM leads l
      LEFT JOIN offers o ON l.offer_id = o.id
      ORDER BY l.created_at DESC
    `).all();
  },

  getNew() {
    return db.prepare(`
      SELECT l.*, o.title as offer_title
      FROM leads l
      LEFT JOIN offers o ON l.offer_id = o.id
      WHERE l.status = 'new'
      ORDER BY l.created_at DESC
    `).all();
  },

  getByOffer(offerId) {
    return db.prepare(`
      SELECT * FROM leads
      WHERE offer_id = ?
      ORDER BY created_at DESC
    `).all(offerId);
  },

  getById(id) {
    return db.prepare(`
      SELECT l.*, o.title as offer_title
      FROM leads l
      LEFT JOIN offers o ON l.offer_id = o.id
      WHERE l.id = ?
    `).get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO leads (
        offer_id, name, email, phone, message, source,
        utm_source, utm_medium, utm_campaign, ip_address, user_agent, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.offer_id || null,
      data.name,
      data.email || null,
      data.phone || null,
      data.message || null,
      data.source || 'landing_page',
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null,
      data.ip_address || null,
      data.user_agent || null,
      data.status || 'new'
    );
    return result.lastInsertRowid;
  },

  updateStatus(id, status, notes = null) {
    if (notes) {
      return db.prepare('UPDATE leads SET status = ?, notes = ? WHERE id = ?').run(status, notes, id);
    }
    return db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
  },

  delete(id) {
    return db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  },

  getStats() {
    return db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
        SUM(CASE WHEN created_at >= date('now', '-7 days') THEN 1 ELSE 0 END) as this_week,
        SUM(CASE WHEN created_at >= date('now', '-30 days') THEN 1 ELSE 0 END) as this_month
      FROM leads
    `).get();
  },

  getNewCount() {
    const result = db.prepare('SELECT COUNT(*) as count FROM leads WHERE status = ?').get('new');
    return result ? result.count : 0;
  }
};
