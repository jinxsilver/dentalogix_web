/**
 * Migration: Add social_posts table
 * Run with: node scripts/migrate-socialposts.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'database.sqlite'));
db.pragma('foreign_keys = ON');

console.log('Running social posts migration...\n');

// Check if social_posts table exists
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name='social_posts'
`).get();

if (!tableExists) {
  console.log('Creating social_posts table...');

  db.exec(`
    CREATE TABLE social_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER REFERENCES offers(id),
      platform TEXT NOT NULL,
      post_type TEXT DEFAULT 'promotional',
      content TEXT NOT NULL,
      hashtags TEXT,
      image_suggestion TEXT,
      link_url TEXT,
      status TEXT DEFAULT 'draft',
      scheduled_for DATETIME,
      posted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('social_posts table created\n');
} else {
  console.log('social_posts table already exists\n');
}

console.log('Migration complete!');
console.log('\nYou can now generate social media posts at /admin/marketing/social');

db.close();
