/**
 * Migration: Add brandscripts table and link to offers
 * Run with: node scripts/migrate-brandscripts.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'database.sqlite'));
db.pragma('foreign_keys = ON');

console.log('🔧 Running StoryBrand migration...\n');

// Check if brandscripts table exists
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name='brandscripts'
`).get();

if (!tableExists) {
  console.log('Creating brandscripts table...');

  db.exec(`
    CREATE TABLE brandscripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,

      -- Character (The Hero - Customer)
      character_name TEXT,
      character_desire TEXT,
      character_identity_from TEXT,
      character_identity_to TEXT,

      -- Villain
      villain_name TEXT,
      villain_description TEXT,

      -- Problems
      problem_external TEXT,
      problem_internal TEXT,
      problem_philosophical TEXT,

      -- Guide (Your Brand)
      guide_empathy_statement TEXT,
      guide_authority_stats TEXT DEFAULT '[]',
      guide_testimonials TEXT DEFAULT '[]',
      guide_awards TEXT DEFAULT '[]',
      guide_logos TEXT DEFAULT '[]',

      -- Plan
      process_plan_name TEXT,
      process_plan_steps TEXT DEFAULT '[]',
      agreement_plan_name TEXT,
      agreement_plan_items TEXT DEFAULT '[]',

      -- Call to Action
      direct_cta_text TEXT DEFAULT 'Schedule Your Visit',
      direct_cta_url TEXT DEFAULT '/contact',
      transitional_ctas TEXT DEFAULT '[]',

      -- Stakes
      failure_consequences TEXT DEFAULT '[]',
      success_outcomes TEXT DEFAULT '[]',

      -- Transformation
      transformation_from TEXT,
      transformation_to TEXT,

      -- One-liner
      one_liner TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ brandscripts table created\n');
} else {
  console.log('ℹ️  brandscripts table already exists\n');
}

// Check if offers table has brandscript_id column
const offerColumns = db.prepare(`PRAGMA table_info(offers)`).all();
const hasBrandscriptId = offerColumns.some(col => col.name === 'brandscript_id');

if (!hasBrandscriptId) {
  console.log('Adding brandscript_id to offers table...');
  db.exec(`ALTER TABLE offers ADD COLUMN brandscript_id INTEGER REFERENCES brandscripts(id)`);
  console.log('✅ brandscript_id column added to offers\n');
} else {
  console.log('ℹ️  offers.brandscript_id already exists\n');
}

// Check if offers table has storybrand section toggles
const hasStoryBrandSections = offerColumns.some(col => col.name === 'show_stakes_section');

if (!hasStoryBrandSections) {
  console.log('Adding StoryBrand section toggles to offers table...');
  db.exec(`
    ALTER TABLE offers ADD COLUMN show_stakes_section INTEGER DEFAULT 0;
  `);
  db.exec(`
    ALTER TABLE offers ADD COLUMN show_guide_section INTEGER DEFAULT 0;
  `);
  db.exec(`
    ALTER TABLE offers ADD COLUMN show_plan_section INTEGER DEFAULT 0;
  `);
  db.exec(`
    ALTER TABLE offers ADD COLUMN show_success_section INTEGER DEFAULT 0;
  `);
  db.exec(`
    ALTER TABLE offers ADD COLUMN show_testimonials_section INTEGER DEFAULT 0;
  `);
  console.log('✅ StoryBrand section toggles added\n');
} else {
  console.log('ℹ️  StoryBrand section toggles already exist\n');
}

// Seed default Dentalogix brandscript
const existingBrandscript = db.prepare('SELECT id FROM brandscripts WHERE brand_name = ?').get('Dentalogix');

if (!existingBrandscript) {
  console.log('Creating default Dentalogix brandscript...');

  const stmt = db.prepare(`
    INSERT INTO brandscripts (
      brand_name, is_active,
      character_name, character_desire, character_identity_from, character_identity_to,
      villain_name, villain_description,
      problem_external, problem_internal, problem_philosophical,
      guide_empathy_statement, guide_authority_stats, guide_testimonials, guide_awards, guide_logos,
      process_plan_name, process_plan_steps, agreement_plan_name, agreement_plan_items,
      direct_cta_text, direct_cta_url, transitional_ctas,
      failure_consequences, success_outcomes,
      transformation_from, transformation_to,
      one_liner
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    'Dentalogix',
    1, // is_active
    'Busy families and individuals',
    'A dental practice that makes oral health easy and stress-free',
    'Anxious and confused about dental care',
    'Confident and in control of their family\'s oral health',
    'Dental anxiety and confusion',
    'The fear, complexity, and impersonal nature of traditional dental care',
    'Finding a trustworthy dentist for the whole family',
    'Feeling anxious, overwhelmed, or embarrassed about dental visits',
    'Everyone deserves access to modern, compassionate dental care without fear',
    'We understand that visiting the dentist can feel stressful. That\'s why we\'ve reimagined what dental care should be.',
    JSON.stringify(['Serving over 10,000 families', '98% patient satisfaction rating']),
    JSON.stringify([
      'The team at Dentalogix made my kids actually look forward to dental visits!',
      'Finally, a dental practice that treats me like a person, not a number.'
    ]),
    JSON.stringify(['Best Family Dental Practice 2024']),
    JSON.stringify(['ADA Member', 'Invisalign Provider']),
    'The Dentalogix Experience',
    JSON.stringify([
      'Schedule your visit online or call us',
      'Meet your care team and create your personalized plan',
      'Enjoy stress-free dental care at any of our locations'
    ]),
    'The Dentalogix Promise',
    JSON.stringify([
      'No surprise billing - transparent pricing always',
      'Same-day emergency appointments when you need us',
      'Your comfort is our priority - ask about our anxiety-free options'
    ]),
    'Schedule Your Visit',
    '/contact',
    JSON.stringify([
      { name: 'Download: 5 Tips for Stress-Free Dental Visits', type: 'pdf', url: '#' },
      { name: 'Take Our Smile Assessment', type: 'quiz', url: '#' }
    ]),
    JSON.stringify([
      'Continued dental anxiety passed to your children',
      'Small problems becoming expensive emergencies',
      'Missing out on the confidence of a healthy smile'
    ]),
    JSON.stringify([
      'A family that smiles with confidence',
      'Preventive care that saves money long-term',
      'A dental home you actually look forward to visiting',
      'Consistent care across all our locations'
    ]),
    'Dental-anxious and reactive',
    'Proactive and confident about oral health',
    'Most people dread the dentist, so we created a network of modern practices where families get personalized, stress-free care—so you can smile with confidence.'
  );

  console.log('✅ Default Dentalogix brandscript created\n');
} else {
  console.log('ℹ️  Dentalogix brandscript already exists\n');
}

console.log('🎉 Migration complete!');
console.log('\nNext steps:');
console.log('  1. Visit /admin/marketing/brandscript to edit your BrandScript');
console.log('  2. Link offers to your BrandScript for auto-generated content');
console.log('  3. Enable StoryBrand sections on your landing pages');

db.close();
