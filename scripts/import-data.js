const fs = require('fs');
const path = require('path');
const db = require('../models/db');

const importFile = path.join(__dirname, '..', 'data-export', 'database-export.json');

if (!fs.existsSync(importFile)) {
  console.log('❌ No import file found at: data-export/database-export.json');
  console.log('   Run "npm run export-data" on your source environment first.');
  process.exit(1);
}

console.log('📥 Importing data...\n');

// Disable foreign key checks during import
db.pragma('foreign_keys = OFF');

const importData = JSON.parse(fs.readFileSync(importFile, 'utf8'));

// Tables to import (order matters for foreign keys)
const tableOrder = ['users', 'settings', 'categories', 'pages', 'posts', 'services', 'team', 'testimonials', 'reviews', 'insurance_providers', 'contacts', 'appointments', 'media'];

// Clear existing data and import new data
tableOrder.forEach(tableName => {
  if (importData[tableName]) {
    const rows = importData[tableName];

    if (rows.length === 0) {
      console.log(`  ⏭ ${tableName}: skipped (no data)`);
      return;
    }

    // Clear existing data
    try {
      db.prepare(`DELETE FROM ${tableName}`).run();
    } catch (e) {
      console.log(`  ⚠ ${tableName}: could not clear (${e.message})`);
    }

    // Get existing columns in the table
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const existingColumns = tableInfo.map(col => col.name);

    // Filter to only columns that exist in both export and table
    const exportColumns = Object.keys(rows[0]);
    const columns = exportColumns.filter(col => existingColumns.includes(col));

    if (columns.length === 0) {
      console.log(`  ⚠ ${tableName}: no matching columns, skipped`);
      return;
    }

    const placeholders = columns.map(() => '?').join(', ');
    const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const insert = db.prepare(insertSQL);

    // Insert each row
    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        insert.run(...values);
      }
    });

    try {
      insertMany(rows);
      console.log(`  ✓ ${tableName}: ${rows.length} rows imported`);
    } catch (e) {
      console.log(`  ❌ ${tableName}: import failed (${e.message})`);
    }
  }
});

// Re-enable foreign key checks
db.pragma('foreign_keys = ON');

console.log('\n✅ Data import complete!');
console.log('\n⚠️  Remember to also copy your /uploads folder for images.');
