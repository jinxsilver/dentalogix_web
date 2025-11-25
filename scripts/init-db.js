const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔧 Initializing database...');

// Create tables
db.exec(`
  -- Users table for admin authentication
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'editor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pages table for static pages
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    hero_image TEXT,
    template TEXT DEFAULT 'default',
    status TEXT DEFAULT 'published',
    sort_order INTEGER DEFAULT 0,
    show_in_nav INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Blog posts table
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    author_id INTEGER,
    category_id INTEGER,
    meta_description TEXT,
    meta_keywords TEXT,
    status TEXT DEFAULT 'draft',
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  -- Categories for blog posts
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Services offered by the dental practice
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    full_description TEXT,
    icon TEXT,
    image TEXT,
    price_range TEXT,
    sort_order INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Team members / Dentists
  CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    photo TEXT,
    email TEXT,
    specialties TEXT,
    credentials TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Testimonials
  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    patient_photo TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    service_id INTEGER,
    featured INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  -- Site settings
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'text'
  );

  -- Media library
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    size INTEGER,
    alt_text TEXT,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  -- Contact form submissions
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Appointments (basic)
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_id INTEGER,
    preferred_date DATE,
    preferred_time TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );
`);

// Insert default admin user
const hashedPassword = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password, role)
  VALUES (?, ?, ?, ?)
`);
insertUser.run('admin', 'admin@dentalogix.com', hashedPassword, 'admin');

// Insert default settings
const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value, type) VALUES (?, ?, ?)
`);

const defaultSettings = [
  ['site_name', 'Dentalogix', 'text'],
  ['site_tagline', 'Modern Dentistry, Exceptional Care', 'text'],
  ['site_logo', '', 'file'],
  ['footer_logo', '', 'file'],
  ['favicon', '', 'file'],
  ['site_theme', 'normal', 'select'],
  ['show_falling_leaves', 'false', 'boolean'],
  ['phone', '(555) 123-4567', 'text'],
  ['email', 'info@dentalogix.com', 'text'],
  ['address', '123 Smile Avenue, Suite 100', 'text'],
  ['city', 'New York, NY 10001', 'text'],
  ['hours_weekday', 'Mon-Fri: 8:00 AM - 6:00 PM', 'text'],
  ['hours_weekend', 'Sat: 9:00 AM - 2:00 PM | Sun: Closed', 'text'],
  ['facebook', 'https://facebook.com/dentalogix', 'text'],
  ['instagram', 'https://instagram.com/dentalogix', 'text'],
  ['twitter', 'https://twitter.com/dentalogix', 'text'],
  ['primary_color', '#0D9488', 'color'],
  ['secondary_color', '#1E293B', 'color'],
  ['accent_color', '#F59E0B', 'color'],
  ['hero_title', 'Your Smile, Our Passion', 'text'],
  ['hero_subtitle', 'Experience gentle, personalized dental care with cutting-edge technology', 'textarea'],
  ['about_text', 'At Dentalogix, we combine advanced dental technology with compassionate care to give you the smile you deserve.', 'textarea'],
  ['footer_text', '© 2024 Dentalogix. All rights reserved.', 'text']
];

defaultSettings.forEach(([key, value, type]) => {
  insertSetting.run(key, value, type);
});

// Insert default categories
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)
`);

const defaultCategories = [
  ['Oral Health', 'oral-health', 'Tips and information about maintaining good oral health'],
  ['Cosmetic Dentistry', 'cosmetic-dentistry', 'Everything about cosmetic dental procedures'],
  ['Dental Technology', 'dental-technology', 'Latest advancements in dental technology'],
  ['Patient Stories', 'patient-stories', 'Success stories from our patients'],
  ['News & Updates', 'news-updates', 'Practice news and announcements']
];

defaultCategories.forEach(([name, slug, description]) => {
  insertCategory.run(name, slug, description);
});

// Insert default services
const insertService = db.prepare(`
  INSERT OR IGNORE INTO services (title, slug, short_description, full_description, icon, sort_order, featured)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const defaultServices = [
  ['Deep Bleaching', 'deep-bleaching', 'Professional teeth whitening for a brilliant smile', 'Our Deep Bleaching technique uses advanced whitening technology to remove years of stains and discoloration. Unlike over-the-counter products, our professional treatment penetrates deep into the enamel for long-lasting, dramatic results.', 'sparkles', 1, 1],
  ['Itero 5D Plus Scanning', 'itero-5d-plus', 'State-of-the-art digital impressions', 'The Itero 5D Plus scanner provides incredibly accurate digital impressions without the discomfort of traditional molds. This technology enables us to detect interproximal cavities, monitor gum health, and create perfect-fit restorations.', 'scan', 2, 1],
  ['General Dentistry', 'general-dentistry', 'Comprehensive care for the whole family', 'From routine cleanings to fillings and preventive care, our general dentistry services keep your smile healthy. We focus on prevention and early detection to maintain your oral health.', 'tooth', 3, 1],
  ['Cosmetic Dentistry', 'cosmetic-dentistry', 'Transform your smile with expert cosmetic care', 'Veneers, bonding, contouring, and smile makeovers designed to give you the confidence to show off your smile. Our cosmetic procedures combine artistry with dental science.', 'star', 4, 0],
  ['Dental Implants', 'dental-implants', 'Permanent solutions for missing teeth', 'Dental implants provide a natural-looking, permanent replacement for missing teeth. Our implant specialists use guided surgery for precise placement and optimal results.', 'implant', 5, 0],
  ['Invisalign', 'invisalign', 'Clear aligners for discreet orthodontics', 'Straighten your teeth without traditional braces. Invisalign clear aligners are virtually invisible and can be removed for eating and cleaning.', 'aligners', 6, 0]
];

defaultServices.forEach(([title, slug, short_desc, full_desc, icon, sort, featured]) => {
  insertService.run(title, slug, short_desc, full_desc, icon, sort, featured);
});

// Insert default pages
const insertPage = db.prepare(`
  INSERT OR IGNORE INTO pages (title, slug, content, meta_description, template, sort_order, show_in_nav)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const defaultPages = [
  ['Home', 'home', 'Welcome to Dentalogix', 'Dentalogix - Modern dentistry with exceptional care in New York', 'home', 1, 0],
  ['About Us', 'about', '<h2>Our Story</h2><p>Founded with a vision to transform dental care, Dentalogix has been serving our community for over 15 years. Our team of dedicated professionals combines expertise with compassion to deliver outstanding dental care.</p><h2>Our Mission</h2><p>To provide exceptional dental care in a comfortable, welcoming environment using the latest technology and techniques.</p>', 'Learn about Dentalogix dental practice and our dedicated team', 'default', 2, 1],
  ['Services', 'services', 'Explore our comprehensive dental services', 'Comprehensive dental services including cosmetic dentistry, implants, and more', 'services', 3, 1],
  ['Blog', 'blog', '', 'Dental health tips, news, and insights from Dentalogix', 'blog', 4, 1],
  ['Contact', 'contact', '<p>We would love to hear from you! Reach out to schedule an appointment or ask any questions.</p>', 'Contact Dentalogix for appointments and inquiries', 'contact', 5, 1]
];

defaultPages.forEach(([title, slug, content, meta, template, sort, nav]) => {
  insertPage.run(title, slug, content, meta, template, sort, nav);
});

// Insert sample blog posts
const insertPost = db.prepare(`
  INSERT OR IGNORE INTO posts (title, slug, excerpt, content, author_id, category_id, status, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const samplePosts = [
  [
    'The Benefits of Deep Bleaching Techniques',
    'benefits-deep-bleaching-techniques',
    'Discover how professional deep bleaching can transform your smile with long-lasting results.',
    '<p>Professional teeth whitening has come a long way from the days of uncomfortable trays and mediocre results. Today\'s deep bleaching techniques offer dramatic improvements that last.</p><h3>What Makes Deep Bleaching Different?</h3><p>Unlike over-the-counter whitening products that only address surface stains, deep bleaching penetrates the enamel to remove intrinsic stains that have built up over years.</p><h3>The Process</h3><p>Our deep bleaching protocol involves both in-office treatment and customized take-home trays for maintenance. This combination approach ensures you achieve and maintain your desired level of whiteness.</p><h3>Who Is a Good Candidate?</h3><p>Most patients with healthy teeth and gums are excellent candidates for deep bleaching. During your consultation, we\'ll evaluate your oral health and discuss realistic expectations for your results.</p>',
    1, 2, 'published', '2024-01-15 10:00:00'
  ],
  [
    'How to Find the Best Dentist That Works for You',
    'find-best-dentist-works-for-you',
    'Tips for choosing a dental practice that meets your needs and makes you feel comfortable.',
    '<p>Finding the right dentist is about more than just convenience. Your dental health partner should make you feel comfortable, heard, and confident in your care.</p><h3>Key Factors to Consider</h3><p>When evaluating potential dentists, consider their credentials, the technology they use, office atmosphere, and how their team communicates with you.</p><h3>Questions to Ask</h3><p>Don\'t be afraid to ask about their approach to patient comfort, continuing education, and how they handle dental emergencies. A great dental practice will welcome your questions.</p><h3>The Importance of Technology</h3><p>Modern dental technology like digital X-rays and intraoral scanners means more accurate diagnoses, less discomfort, and better outcomes. Ask about the technology a practice uses.</p>',
    1, 1, 'published', '2024-01-20 14:30:00'
  ],
  [
    'Introducing the Itero 5D Plus Scanner',
    'introducing-itero-5d-plus-scanner',
    'Learn about our newest technology for more comfortable and accurate dental impressions.',
    '<p>We\'re excited to announce the addition of the Itero 5D Plus scanner to our practice. This revolutionary device is changing how we approach dental diagnostics and treatment planning.</p><h3>No More Gooey Impressions</h3><p>Say goodbye to uncomfortable impression trays filled with gooey material. The Itero scanner captures detailed 3D images of your teeth in minutes, with no discomfort.</p><h3>Advanced Diagnostic Capabilities</h3><p>The 5D Plus doesn\'t just create digital impressions—it can detect interproximal cavities that might be missed by traditional X-rays and even visualize changes in your gum health over time.</p><h3>Better Fitting Restorations</h3><p>Digital impressions are more accurate than traditional ones, which means your crowns, bridges, and aligners will fit better from the start.</p>',
    1, 3, 'published', '2024-02-01 09:00:00'
  ]
];

samplePosts.forEach(([title, slug, excerpt, content, author, category, status, published]) => {
  insertPost.run(title, slug, excerpt, content, author, category, status, published);
});

// Insert sample team members
const insertTeam = db.prepare(`
  INSERT OR IGNORE INTO team (name, title, bio, specialties, credentials, sort_order)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const sampleTeam = [
  ['Dr. Sarah Mitchell', 'Lead Dentist & Founder', 'Dr. Mitchell founded Dentalogix with a vision to provide exceptional dental care using the latest technology. With over 15 years of experience, she specializes in cosmetic and restorative dentistry.', 'Cosmetic Dentistry, Implants, Smile Makeovers', 'DDS, NYU College of Dentistry; Fellow, Academy of General Dentistry', 1],
  ['Dr. James Chen', 'Orthodontist', 'Dr. Chen brings expertise in both traditional orthodontics and clear aligner therapy. He is passionate about creating beautiful, functional smiles for patients of all ages.', 'Invisalign, Traditional Braces, Early Intervention', 'DMD, Harvard School of Dental Medicine; MS Orthodontics, Columbia', 2],
  ['Dr. Maria Santos', 'Periodontist', 'Dr. Santos specializes in gum health and dental implants. Her gentle approach and advanced training make her a favorite among patients who need specialized periodontal care.', 'Periodontal Treatment, Dental Implants, Gum Grafting', 'DDS, Boston University; Periodontics Certificate, Penn Dental', 3]
];

sampleTeam.forEach(([name, title, bio, specialties, credentials, sort]) => {
  insertTeam.run(name, title, bio, specialties, credentials, sort);
});

// Insert sample testimonials
const insertTestimonial = db.prepare(`
  INSERT OR IGNORE INTO testimonials (patient_name, content, rating, featured)
  VALUES (?, ?, ?, ?)
`);

const sampleTestimonials = [
  ['Jennifer M.', 'I was terrified of the dentist until I found Dentalogix. Dr. Mitchell and her team made me feel so comfortable. My smile has never looked better!', 5, 1],
  ['Robert K.', 'The Itero scanner made getting fitted for my crown so easy. No more gagging on impression material! Highly recommend this practice.', 5, 1],
  ['Amanda S.', 'After years of being embarrassed by my smile, the deep bleaching treatment gave me the confidence to smile in photos again. Thank you, Dentalogix!', 5, 1]
];

sampleTestimonials.forEach(([name, content, rating, featured]) => {
  insertTestimonial.run(name, content, rating, featured);
});

console.log('✅ Database initialized successfully!');
console.log('📧 Default admin credentials:');
console.log('   Username: admin');
console.log('   Password: admin123');
console.log('   ⚠️  Please change these after first login!');

db.close();
