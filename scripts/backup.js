#!/usr/bin/env node
/**
 * Backup Script for Dentalogix
 * Creates a backup of the database and uploads folder
 *
 * Usage: node scripts/backup.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups');
const DB_FILE = path.join(ROOT_DIR, 'database.sqlite');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

// Create timestamp for backup folder
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFolder = path.join(BACKUP_DIR, `backup-${timestamp}`);

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create this backup's folder
fs.mkdirSync(backupFolder, { recursive: true });

console.log(`Creating backup in: ${backupFolder}`);

// Backup database
if (fs.existsSync(DB_FILE)) {
  fs.copyFileSync(DB_FILE, path.join(backupFolder, 'database.sqlite'));
  console.log('✓ Database backed up');
} else {
  console.log('✗ No database file found');
}

// Backup uploads folder
const uploadsBackupDir = path.join(backupFolder, 'uploads');
if (fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(uploadsBackupDir, { recursive: true });

  const files = fs.readdirSync(UPLOADS_DIR);
  let count = 0;
  files.forEach(file => {
    if (file !== '.gitkeep') {
      fs.copyFileSync(
        path.join(UPLOADS_DIR, file),
        path.join(uploadsBackupDir, file)
      );
      count++;
    }
  });
  console.log(`✓ Uploads backed up (${count} files)`);
} else {
  console.log('✗ No uploads folder found');
}

console.log(`\nBackup complete: ${backupFolder}`);
console.log('\nTo restore, run: node scripts/restore.js ' + timestamp);
