const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'database.sqlite'));

console.log('🔧 Updating site data with complete dentalogix.us information...');

// Update settings
const updateSetting = db.prepare('UPDATE settings SET value = ? WHERE key = ?');

const newSettings = {
  site_name: 'Dentalogix',
  site_tagline: 'Your Smile is Our Priority',
  phone: '(716) 555-0123',
  email: 'info@dentalogix.us',
  address: '2233 W Seneca St',
  city: 'Buffalo, NY 14210',
  hours_weekday: 'Mon-Sat: 9:00 AM - 5:00 PM',
  hours_weekend: 'Sunday: Closed',
  hero_title: 'Your Smile is Our Priority',
  hero_subtitle: 'Comprehensive dental care services using state-of-the-art technology. Experience modern dentistry with cutting-edge equipment and compassionate care.',
  about_text: 'Dentalogix provides comprehensive dental care services using state-of-the-art technology. We combine quality care with up-to-date equipment to serve patients of all ages, diagnosing underlying causes of oral issues before treatment.',
  footer_text: '© 2024 Dentalogix. All rights reserved.',
  primary_color: '#B45309',
  secondary_color: '#78350F',
  accent_color: '#F59E0B'
};

for (const [key, value] of Object.entries(newSettings)) {
  updateSetting.run(value, key);
}

// Clear existing team and add leadership
db.prepare('DELETE FROM team').run();

const insertTeam = db.prepare(`
  INSERT INTO team (name, title, bio, specialties, credentials, photo, sort_order, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
`);

// Dr. Jin Mai-Soto - Chief Dental Practitioner (with full bio)
insertTeam.run(
  'Dr. Jin Mai-Soto',
  'Chief Dental Practitioner',
  `Dr. Jin Mai-Soto's journey into dentistry began with a childhood dream of practicing medicine. Originally from China, she immigrated to the United States with a deep passion for healthcare and a desire to make a meaningful impact. Inspired by the emphasis on preventive dental care in the U.S., she chose to pursue dentistry as her lifelong career.

While working toward her dental degree, Dr. Mai-Soto proudly joined the Army National Guard, where she developed discipline, resilience, and a commitment to service that she brings into her practice every day.

Dr. Mai-Soto has a special interest in surgical procedures and continues to expand her expertise through advanced training. She has completed impacted third molar extraction training and over 300 hours of implant course continuum, equipping her with the skills to perform complex procedures with precision and care.

Outside of the clinic, Dr. Mai-Soto dedicates her time to personal growth and continuous learning, always striving to provide the highest level of care to her patients.`,
  'General Dentist, Surgical Dentistry, Implants, Third Molar Extractions',
  'DDS - NYU College of Dentistry, Army National Guard Veteran, 300+ Hours Implant Training',
  '/uploads/1764044494895-648584815.jpg',
  1
);

// Rey Soto - Chief Operations Officer
insertTeam.run(
  'Rey Soto',
  'Chief Operations Officer',
  'Rey Soto brings over 23 years of US Army experience to Dentalogix, combining military precision with healthcare operations expertise. With a business management background from Harvard University and specialized experience in cybersecurity within the healthcare sector, Rey ensures that Dentalogix operates with the highest standards of efficiency, security, and patient care.',
  'Healthcare Operations, Cybersecurity, Business Management, Strategic Planning',
  'Harvard University Business Management, 23-Year US Army Veteran, Healthcare Cybersecurity Specialist',
  '/uploads/1764044531405-933626311.jpg',
  2
);

// Add clinical team members
insertTeam.run(
  'Dr. Sarah Chen',
  'Associate Dentist',
  'Dr. Chen brings expertise in restorative and cosmetic dentistry. Her gentle approach and attention to detail make her a favorite among patients seeking smile makeovers and complex dental work.',
  'Cosmetic Dentistry, Veneers, Dental Implants, Invisalign',
  'DMD, Certified Invisalign Provider',
  null,
  3
);

insertTeam.run(
  'Maria Rodriguez',
  'Lead Dental Hygienist',
  'Maria has been with Dentalogix since its founding. She is passionate about patient education and preventive care, helping patients maintain healthy smiles between visits.',
  'Preventive Care, Deep Cleaning, Patient Education, Periodontal Maintenance',
  'RDH, Certified in Laser Dentistry',
  null,
  4
);

// Update services - combined and reorganized with fixed images
db.prepare('DELETE FROM services').run();

const insertService = db.prepare(`
  INSERT INTO services (title, slug, short_description, full_description, icon, image, sort_order, featured, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')
`);

const services = [
  {
    title: 'General & Preventive Care',
    slug: 'general-preventive-care',
    short: 'Comprehensive care to protect and maintain your smile',
    full: 'Our general and preventive dentistry services focus on maintaining healthy teeth and gums through regular exams, cleanings, and preventive treatments. We use advanced diagnostic tools like digital X-rays and provide personalized oral hygiene education. Our comprehensive oral health services evaluate your gums, jaw, bite alignment, and overall oral health to ensure everything is functioning properly.',
    icon: 'tooth',
    image: 'https://images.pexels.com/photos/3845653/pexels-photo-3845653.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 1,
    featured: 1
  },
  {
    title: 'Cosmetic Dentistry',
    slug: 'cosmetic-dentistry',
    short: 'Transform your smile with confidence',
    full: 'Enhance the appearance of your teeth with our cosmetic dentistry options, including professional teeth whitening, porcelain veneers, and Invisalign® clear aligners. Whether you\'re preparing for a big event or simply want a brighter smile, we offer solutions tailored to your goals. Our cosmetic procedures combine artistry with dental science for natural-looking, beautiful results.',
    icon: 'sparkles',
    image: 'https://images.pexels.com/photos/3762453/pexels-photo-3762453.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 2,
    featured: 1
  },
  {
    title: 'Restorative Dentistry',
    slug: 'restorative-dentistry',
    short: 'Restore function and beauty to your teeth',
    full: 'From fillings and crowns to dental implants and dentures, our restorative treatments repair damaged or missing teeth to improve your oral health and confidence. We use durable, natural-looking materials to ensure long-lasting results. Whether you need a simple filling or a complete smile reconstruction, we have the expertise to help.',
    icon: 'repair',
    image: 'https://images.pexels.com/photos/6627536/pexels-photo-6627536.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 3,
    featured: 1
  },
  {
    title: 'Crowns & Bridges',
    slug: 'crowns-bridges',
    short: 'Durable solutions for damaged or missing teeth',
    full: 'Dental crowns and bridges are reliable solutions for restoring damaged, decayed, or missing teeth. Crowns cap and protect weakened teeth while restoring their shape and function. Bridges replace one or more missing teeth by anchoring to adjacent teeth. We use high-quality materials including porcelain and ceramic for a natural appearance that blends seamlessly with your smile.',
    icon: 'crown',
    image: 'https://images.pexels.com/photos/3779709/pexels-photo-3779709.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 4,
    featured: 0
  },
  {
    title: 'Dentures',
    slug: 'dentures',
    short: 'Custom-fitted dentures for a complete smile',
    full: 'Whether you need full or partial dentures, we create custom-fitted solutions that look natural and feel comfortable. Our dentures are crafted using advanced materials and techniques to ensure a secure fit and optimal function. We also offer implant-supported dentures for enhanced stability. Our team will guide you through the process and ensure your dentures meet your needs.',
    icon: 'dentures',
    image: 'https://images.pexels.com/photos/6627407/pexels-photo-6627407.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 5,
    featured: 0
  },
  {
    title: 'Orthodontics',
    slug: 'orthodontics',
    short: 'Straighten your smile discreetly',
    full: 'Achieve a well-aligned smile with clear aligners like Invisalign® and custom retainers. Our orthodontic solutions are ideal for teens and adults seeking a comfortable, nearly invisible way to improve their bite and appearance. Straightening your teeth has never been more convenient or discreet.',
    icon: 'aligners',
    image: 'https://images.pexels.com/photos/3845806/pexels-photo-3845806.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 6,
    featured: 0
  },
  {
    title: 'Pediatric Dentistry',
    slug: 'pediatric-dentistry',
    short: 'Gentle dental care for growing smiles',
    full: 'We offer essential pediatric dental services including exams, cleanings, and fluoride treatments. Our team creates a welcoming environment to help children feel comfortable while building healthy habits from an early age. Starting dental care early sets the foundation for a lifetime of healthy smiles.',
    icon: 'child',
    image: 'https://images.pexels.com/photos/3845625/pexels-photo-3845625.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 7,
    featured: 0
  },
  {
    title: 'Sedation Dentistry',
    slug: 'sedation-dentistry',
    short: 'Relax with gentle sedation options',
    full: 'For patients with dental anxiety, we offer Nitrous Oxide (laughing gas) to help you feel calm and comfortable during treatment. Safe and effective, it\'s a great option for both children and adults needing a little extra ease in the chair. Don\'t let fear keep you from the care you need.',
    icon: 'relax',
    image: 'https://images.pexels.com/photos/3881449/pexels-photo-3881449.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 8,
    featured: 0
  },
  {
    title: 'Periodontal Care',
    slug: 'periodontal-care',
    short: 'Protect your gums and preserve your smile',
    full: 'Healthy gums are the foundation of a healthy mouth. Our periodontal services include deep cleanings and ongoing maintenance to treat and manage gum disease, helping you avoid tooth loss and other complications. Early intervention is key to maintaining your oral health.',
    icon: 'gums',
    image: 'https://images.pexels.com/photos/6627531/pexels-photo-6627531.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 9,
    featured: 0
  },
  {
    title: 'Oral Surgery',
    slug: 'oral-surgery',
    short: 'Expert care for complex dental needs',
    full: 'Our oral surgery services include wisdom tooth extractions, dental implant placement, bone grafting, and PRF (Platelet-Rich Fibrin) therapy to support healing and regeneration. We prioritize comfort and precision in every procedure, using the latest techniques to ensure the best outcomes.',
    icon: 'surgery',
    image: 'https://images.pexels.com/photos/3845766/pexels-photo-3845766.jpeg?auto=compress&cs=tinysrgb&w=600',
    sort: 10,
    featured: 0
  }
];

services.forEach(s => {
  insertService.run(s.title, s.slug, s.short, s.full, s.icon, s.image, s.sort, s.featured);
});

// Update testimonials
db.prepare('DELETE FROM testimonials').run();

const insertTestimonial = db.prepare(`
  INSERT INTO testimonials (patient_name, content, rating, featured, status)
  VALUES (?, ?, ?, ?, 'published')
`);

const testimonials = [
  {
    name: 'Michael R.',
    content: 'Dr. Mai-Soto and her team made me feel completely at ease during my root canal. I was dreading it, but they explained everything and the procedure was virtually painless. Highly recommend Dentalogix!',
    rating: 5,
    featured: 1
  },
  {
    name: 'Sarah T.',
    content: 'I got my Invisalign through Dentalogix and couldn\'t be happier with the results. The staff was always helpful with my questions and my teeth look amazing now!',
    rating: 5,
    featured: 1
  },
  {
    name: 'James L.',
    content: 'After years of being embarrassed about my smile, I finally got veneers at Dentalogix. The transformation is incredible and the team made the whole process comfortable.',
    rating: 5,
    featured: 1
  },
  {
    name: 'Linda M.',
    content: 'My kids actually look forward to their dental visits now! The staff is so gentle and patient with children. We\'ve found our family dentist for life.',
    rating: 5,
    featured: 0
  },
  {
    name: 'Robert K.',
    content: 'The sedation dentistry option was a game-changer for me. I\'ve avoided the dentist for years due to anxiety, but Dentalogix made it possible for me to get the care I needed.',
    rating: 5,
    featured: 0
  }
];

testimonials.forEach(t => {
  insertTestimonial.run(t.name, t.content, t.rating, t.featured);
});

console.log('✅ Site data updated successfully!');
console.log('   - Settings updated with dentalogix.us info');
console.log('   - Leadership team with photos:');
console.log('     • Dr. Jin Mai-Soto (Chief Dental Practitioner) - with full bio & photo');
console.log('     • Rey Soto (COO) - with photo');
console.log('   - 10 services added (with updated images):');
console.log('     • Crowns & Bridges - fixed image');
console.log('     • Sedation Dentistry - fixed image (relaxed patient)');
console.log('   - 5 testimonials added');

db.close();
