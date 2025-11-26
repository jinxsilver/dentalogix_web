const db = require('./db');

module.exports = {
  getSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  },

  getAllSettings() {
    return db.prepare('SELECT * FROM settings ORDER BY key').all();
  },

  getSetting(key) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  },

  updateSetting(key, value) {
    return db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(value, key);
  },

  updateSettings(settings) {
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const transaction = db.transaction((items) => {
      for (const [key, value] of Object.entries(items)) {
        upsert.run(key, value);
      }
    });
    transaction(settings);
  }
};
