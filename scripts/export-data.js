const fs = require('fs');
const path = require('path');
const db = require('../models/db');

// Export directory
const exportDir = path.join(__dirname, '..', 'data-export');

// Create export directory if it doesn't exist
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

console.log('📦 Exporting data...\n');

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

const exportData = {};

tables.forEach(table => {
  const tableName = table.name;
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
  exportData[tableName] = rows;
  console.log(`  ✓ ${tableName}: ${rows.length} rows`);
});

// Write to JSON file
const exportFile = path.join(exportDir, 'database-export.json');
fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));

console.log(`\n✅ Data exported to: ${exportFile}`);
console.log('\n📁 To complete the backup, also copy your /uploads folder.');
console.log('\n📋 To import this data on another server:');
console.log('   1. Copy data-export/database-export.json to the server');
console.log('   2. Copy the uploads/ folder to the server');
console.log('   3. Run: npm run import-data');
