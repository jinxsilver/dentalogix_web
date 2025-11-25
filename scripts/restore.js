#!/usr/bin/env node
/**
 * Restore Script for Dentalogix
 * Restores a backup of the database and uploads folder
 *
 * Usage: node scripts/restore.js [backup-timestamp]
 * Example: node scripts/restore.js 2024-11-25T12-30-00
 *
 * If no timestamp is provided, it will list available backups
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups');
const DB_FILE = path.join(ROOT_DIR, 'database.sqlite');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

// Get backup timestamp from command line
const timestamp = process.argv[2];

// List available backups if no timestamp provided
if (!timestamp) {
  console.log('Available backups:\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups found. Run: node scripts/backup.js first');
    process.exit(1);
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.log('No backups found. Run: node scripts/backup.js first');
    process.exit(1);
  }

  backups.forEach((backup, i) => {
    const ts = backup.replace('backup-', '');
    console.log(`  ${i + 1}. ${ts}`);
  });

  console.log('\nUsage: node scripts/restore.js [timestamp]');
  console.log('Example: node scripts/restore.js ' + backups[0].replace('backup-', ''));
  process.exit(0);
}

const backupFolder = path.join(BACKUP_DIR, `backup-${timestamp}`);

if (!fs.existsSync(backupFolder)) {
  console.log(`Backup not found: ${backupFolder}`);
  console.log('Run: node scripts/restore.js (without arguments) to see available backups');
  process.exit(1);
}

console.log(`Restoring from: ${backupFolder}`);

// Restore database
const backupDb = path.join(backupFolder, 'database.sqlite');
if (fs.existsSync(backupDb)) {
  fs.copyFileSync(backupDb, DB_FILE);
  console.log('✓ Database restored');
} else {
  console.log('✗ No database in backup');
}

// Restore uploads
const backupUploads = path.join(backupFolder, 'uploads');
if (fs.existsSync(backupUploads)) {
  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(backupUploads);
  let count = 0;
  files.forEach(file => {
    fs.copyFileSync(
      path.join(backupUploads, file),
      path.join(UPLOADS_DIR, file)
    );
    count++;
  });
  console.log(`✓ Uploads restored (${count} files)`);
} else {
  console.log('✗ No uploads in backup');
}

console.log('\nRestore complete!');
console.log('Note: You may need to restart the server for changes to take effect.');
