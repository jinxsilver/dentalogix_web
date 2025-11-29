const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Models
const Settings = require('../models/settings');
const Pages = require('../models/pages');
const Posts = require('../models/posts');
const Services = require('../models/services');
const Team = require('../models/team');
const Testimonials = require('../models/testimonials');
const Categories = require('../models/categories');
const Contacts = require('../models/contacts');
const Users = require('../models/users');
const Reviews = require('../models/reviews');
const Insurance = require('../models/insurance');
const Offers = require('../models/offers');
const Leads = require('../models/leads');
const BrandScripts = require('../models/brandscripts');
const SocialPosts = require('../models/socialposts');
const Quiz = require('../models/quiz');
const GoogleReviewsService = require('../lib/googleReviews');
const EmailService = require('../lib/email');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Helper function
const getAdminData = () => ({
  settings: Settings.getSettings(),
  newLeadsCount: Leads.getNewCount()
});

// =====================
// Authentication Routes
// =====================

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'Admin Login',
    error: null,
    settings: Settings.getSettings()
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = Users.authenticate(username, password);

  if (user) {
    req.session.user = user;
    res.redirect('/admin');
  } else {
    res.render('admin/login', {
      title: 'Admin Login',
      error: 'Invalid username or password',
      settings: Settings.getSettings()
    });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// =====================
// Dashboard
// =====================

router.get('/', requireAuth, (req, res) => {
  const stats = {
    pages: Pages.getAll().length,
    posts: Posts.getAll().length,
    services: Services.getAll().length,
    contacts: Contacts.countUnread()
  };

  const recentContacts = Contacts.getUnread().slice(0, 5);
  const recentPosts = Posts.getAll().slice(0, 5);
  const recentReviews = Reviews.getRecent(5);
  const reviewStats = Reviews.getStats();

  res.render('admin/dashboard', {
    ...getAdminData(),
    title: 'Dashboard',
    stats,
    recentContacts,
    recentPosts,
    recentReviews,
    reviewStats
  });
});

// =====================
// Pages Management
// =====================

router.get('/pages', requireAuth, (req, res) => {
  const pages = Pages.getAll();
  res.render('admin/pages/index', {
    ...getAdminData(),
    title: 'Manage Pages',
    pages
  });
});

// Home page editor
router.get('/pages/home', requireAuth, (req, res) => {
  res.render('admin/pages/home', {
    ...getAdminData(),
    title: 'Edit Home Page',
    success: req.query.success
  });
});

const homeUpload = upload.fields([
  { name: 'about_image_main', maxCount: 1 },
  { name: 'about_image_secondary', maxCount: 1 },
  { name: 'problem_villain_image', maxCount: 1 },
  { name: 'problem_external_image', maxCount: 1 },
  { name: 'problem_internal_image', maxCount: 1 },
  { name: 'problem_philosophical_image', maxCount: 1 },
  { name: 'stakes_section_image', maxCount: 1 }
]);

router.post('/pages/home', requireAuth, homeUpload, (req, res) => {
  const settingsData = {};
  if (req.files) {
    // Guide Section Images
    if (req.files.about_image_main && req.files.about_image_main[0]) {
      settingsData.about_image_main = '/uploads/' + req.files.about_image_main[0].filename;
    }
    if (req.files.about_image_secondary && req.files.about_image_secondary[0]) {
      settingsData.about_image_secondary = '/uploads/' + req.files.about_image_secondary[0].filename;
    }
    // Problem Section Images
    if (req.files.problem_villain_image && req.files.problem_villain_image[0]) {
      settingsData.problem_villain_image = '/uploads/' + req.files.problem_villain_image[0].filename;
    }
    if (req.files.problem_external_image && req.files.problem_external_image[0]) {
      settingsData.problem_external_image = '/uploads/' + req.files.problem_external_image[0].filename;
    }
    if (req.files.problem_internal_image && req.files.problem_internal_image[0]) {
      settingsData.problem_internal_image = '/uploads/' + req.files.problem_internal_image[0].filename;
    }
    if (req.files.problem_philosophical_image && req.files.problem_philosophical_image[0]) {
      settingsData.problem_philosophical_image = '/uploads/' + req.files.problem_philosophical_image[0].filename;
    }
    // Stakes Section Image
    if (req.files.stakes_section_image && req.files.stakes_section_image[0]) {
      settingsData.stakes_section_image = '/uploads/' + req.files.stakes_section_image[0].filename;
    }
  }
  if (Object.keys(settingsData).length > 0) {
    Settings.updateSettings(settingsData);
  }
  res.redirect('/admin/pages/home?success=1');
});

router.get('/pages/new', requireAuth, (req, res) => {
  res.render('admin/pages/edit', {
    ...getAdminData(),
    title: 'New Page',
    page: null
  });
});

router.post('/pages', requireAuth, upload.single('hero_image'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.hero_image = '/uploads/' + req.file.filename;
  }
  Pages.create(data);
  res.redirect('/admin/pages');
});

router.get('/pages/:id/edit', requireAuth, (req, res) => {
  const page = Pages.getById(req.params.id);
  if (!page) return res.redirect('/admin/pages');
  
  res.render('admin/pages/edit', {
    ...getAdminData(),
    title: 'Edit Page',
    page
  });
});

router.post('/pages/:id', requireAuth, upload.fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'mobile_dentistry_image', maxCount: 1 },
  { name: 'mobile_service_cleanings_image', maxCount: 1 },
  { name: 'mobile_service_xrays_image', maxCount: 1 },
  { name: 'mobile_service_whitening_image', maxCount: 1 },
  { name: 'mobile_service_fillings_image', maxCount: 1 },
  { name: 'mobile_service_consultations_image', maxCount: 1 },
  { name: 'mobile_service_periodontal_image', maxCount: 1 }
]), (req, res) => {
  console.log('Files received:', req.files);
  const data = { ...req.body };
  const settingsData = {};

  if (req.files) {
    // Handle hero image for the page
    if (req.files.hero_image && req.files.hero_image[0]) {
      data.hero_image = '/uploads/' + req.files.hero_image[0].filename;
    }
    // Handle mobile dentistry images (saved to settings)
    if (req.files.mobile_dentistry_image && req.files.mobile_dentistry_image[0]) {
      settingsData.mobile_dentistry_image = '/uploads/' + req.files.mobile_dentistry_image[0].filename;
    }
    // Handle mobile dentistry service images (saved to settings)
    if (req.files.mobile_service_cleanings_image && req.files.mobile_service_cleanings_image[0]) {
      settingsData.mobile_service_cleanings_image = '/uploads/' + req.files.mobile_service_cleanings_image[0].filename;
    }
    if (req.files.mobile_service_xrays_image && req.files.mobile_service_xrays_image[0]) {
      settingsData.mobile_service_xrays_image = '/uploads/' + req.files.mobile_service_xrays_image[0].filename;
    }
    if (req.files.mobile_service_whitening_image && req.files.mobile_service_whitening_image[0]) {
      settingsData.mobile_service_whitening_image = '/uploads/' + req.files.mobile_service_whitening_image[0].filename;
    }
    if (req.files.mobile_service_fillings_image && req.files.mobile_service_fillings_image[0]) {
      settingsData.mobile_service_fillings_image = '/uploads/' + req.files.mobile_service_fillings_image[0].filename;
    }
    if (req.files.mobile_service_consultations_image && req.files.mobile_service_consultations_image[0]) {
      settingsData.mobile_service_consultations_image = '/uploads/' + req.files.mobile_service_consultations_image[0].filename;
    }
    if (req.files.mobile_service_periodontal_image && req.files.mobile_service_periodontal_image[0]) {
      settingsData.mobile_service_periodontal_image = '/uploads/' + req.files.mobile_service_periodontal_image[0].filename;
    }
  }

  Pages.update(req.params.id, data);

  // Save mobile dentistry images to settings if any were uploaded
  if (Object.keys(settingsData).length > 0) {
    Settings.updateSettings(settingsData);
  }

  res.redirect('/admin/pages');
});

router.post('/pages/:id/delete', requireAuth, (req, res) => {
  Pages.delete(req.params.id);
  res.redirect('/admin/pages');
});

// =====================
// Blog Posts Management
// =====================

router.get('/posts', requireAuth, (req, res) => {
  const posts = Posts.getAll();
  res.render('admin/posts/index', {
    ...getAdminData(),
    title: 'Manage Blog Posts',
    posts
  });
});

router.get('/posts/new', requireAuth, (req, res) => {
  const categories = Categories.getAll();
  res.render('admin/posts/edit', {
    ...getAdminData(),
    title: 'New Post',
    post: null,
    categories
  });
});

router.post('/posts', requireAuth, upload.single('featured_image'), (req, res) => {
  const data = { ...req.body, author_id: req.session.user.id };
  if (req.file) {
    data.featured_image = '/uploads/' + req.file.filename;
  }
  Posts.create(data);
  res.redirect('/admin/posts');
});

router.get('/posts/:id/edit', requireAuth, (req, res) => {
  const post = Posts.getById(req.params.id);
  if (!post) return res.redirect('/admin/posts');
  
  const categories = Categories.getAll();
  res.render('admin/posts/edit', {
    ...getAdminData(),
    title: 'Edit Post',
    post,
    categories
  });
});

router.post('/posts/:id', requireAuth, upload.single('featured_image'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.featured_image = '/uploads/' + req.file.filename;
  }
  Posts.update(req.params.id, data);
  res.redirect('/admin/posts');
});

router.post('/posts/:id/delete', requireAuth, (req, res) => {
  Posts.delete(req.params.id);
  res.redirect('/admin/posts');
});

// =====================
// Categories Management
// =====================

router.get('/categories', requireAuth, (req, res) => {
  const categories = Categories.getAll();
  res.render('admin/categories/index', {
    ...getAdminData(),
    title: 'Manage Categories',
    categories
  });
});

router.post('/categories', requireAuth, (req, res) => {
  Categories.create(req.body);
  res.redirect('/admin/categories');
});

router.post('/categories/:id', requireAuth, (req, res) => {
  Categories.update(req.params.id, req.body);
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', requireAuth, (req, res) => {
  Categories.delete(req.params.id);
  res.redirect('/admin/categories');
});

// =====================
// Services Management
// =====================

router.get('/services', requireAuth, (req, res) => {
  const services = Services.getAll();
  res.render('admin/services/index', {
    ...getAdminData(),
    title: 'Manage Services',
    services
  });
});

router.get('/services/new', requireAuth, (req, res) => {
  res.render('admin/services/edit', {
    ...getAdminData(),
    title: 'New Service',
    service: null
  });
});

router.post('/services', requireAuth, upload.single('image'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.image = '/uploads/' + req.file.filename;
  }
  Services.create(data);
  res.redirect('/admin/services');
});

router.get('/services/:id/edit', requireAuth, (req, res) => {
  const service = Services.getById(req.params.id);
  if (!service) return res.redirect('/admin/services');
  
  res.render('admin/services/edit', {
    ...getAdminData(),
    title: 'Edit Service',
    service
  });
});

router.post('/services/:id', requireAuth, upload.single('image'), (req, res) => {
  const existing = Services.getById(req.params.id);
  if (!existing) return res.redirect('/admin/services');

  const data = { ...req.body };
  if (req.file) {
    data.image = '/uploads/' + req.file.filename;
  } else if (existing.image) {
    // Preserve existing image if no new one uploaded
    data.image = existing.image;
  }
  Services.update(req.params.id, data);
  res.redirect('/admin/services');
});

router.post('/services/:id/delete', requireAuth, (req, res) => {
  Services.delete(req.params.id);
  res.redirect('/admin/services');
});

// =====================
// Team Management
// =====================

router.get('/team', requireAuth, (req, res) => {
  const team = Team.getAll();
  res.render('admin/team/index', {
    ...getAdminData(),
    title: 'Manage Team',
    team
  });
});

router.get('/team/new', requireAuth, (req, res) => {
  res.render('admin/team/edit', {
    ...getAdminData(),
    title: 'New Team Member',
    member: null
  });
});

const teamUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'grad_logo_file', maxCount: 1 },
  { name: 'undergrad_logo_file', maxCount: 1 }
]);

router.post('/team', requireAuth, teamUpload, (req, res) => {
  const data = { ...req.body };
  if (req.files && req.files.photo) {
    data.photo = '/uploads/' + req.files.photo[0].filename;
  }
  if (req.files && req.files.grad_logo_file) {
    data.grad_logo = '/uploads/' + req.files.grad_logo_file[0].filename;
  }
  if (req.files && req.files.undergrad_logo_file) {
    data.undergrad_logo = '/uploads/' + req.files.undergrad_logo_file[0].filename;
  }
  Team.create(data);
  res.redirect('/admin/team');
});

router.get('/team/:id/edit', requireAuth, (req, res) => {
  const member = Team.getById(req.params.id);
  if (!member) return res.redirect('/admin/team');
  
  res.render('admin/team/edit', {
    ...getAdminData(),
    title: 'Edit Team Member',
    member
  });
});

router.post('/team/:id', requireAuth, teamUpload, (req, res) => {
  const existingMember = Team.getById(req.params.id);
  const data = { ...req.body };

  // Handle photo - new upload takes priority, otherwise keep existing
  if (req.files && req.files.photo && req.files.photo[0]) {
    data.photo = '/uploads/' + req.files.photo[0].filename;
  } else if (existingMember && existingMember.photo) {
    data.photo = existingMember.photo;
  }

  // Handle grad_logo - file upload takes priority, then new URL, then keep existing
  if (req.files && req.files.grad_logo_file && req.files.grad_logo_file[0]) {
    data.grad_logo = '/uploads/' + req.files.grad_logo_file[0].filename;
  } else if (data.grad_logo && data.grad_logo.trim() !== '') {
    // New URL provided, use it
  } else if (existingMember && existingMember.grad_logo) {
    data.grad_logo = existingMember.grad_logo;
  }

  // Handle undergrad_logo - file upload takes priority, then new URL, then keep existing
  if (req.files && req.files.undergrad_logo_file && req.files.undergrad_logo_file[0]) {
    data.undergrad_logo = '/uploads/' + req.files.undergrad_logo_file[0].filename;
  } else if (data.undergrad_logo && data.undergrad_logo.trim() !== '') {
    // New URL provided, use it
  } else if (existingMember && existingMember.undergrad_logo) {
    data.undergrad_logo = existingMember.undergrad_logo;
  }

  Team.update(req.params.id, data);
  res.redirect('/admin/team');
});

router.post('/team/:id/delete', requireAuth, (req, res) => {
  Team.delete(req.params.id);
  res.redirect('/admin/team');
});

// =====================
// Testimonials Management
// =====================

router.get('/testimonials', requireAuth, (req, res) => {
  const testimonials = Testimonials.getAll();
  const services = Services.getAll();
  res.render('admin/testimonials/index', {
    ...getAdminData(),
    title: 'Manage Testimonials',
    testimonials,
    services
  });
});

router.get('/testimonials/new', requireAuth, (req, res) => {
  const services = Services.getAll();
  res.render('admin/testimonials/edit', {
    ...getAdminData(),
    title: 'New Testimonial',
    testimonial: null,
    services
  });
});

router.post('/testimonials', requireAuth, upload.single('patient_photo'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.patient_photo = '/uploads/' + req.file.filename;
  }
  Testimonials.create(data);
  res.redirect('/admin/testimonials');
});

router.get('/testimonials/:id/edit', requireAuth, (req, res) => {
  const testimonial = Testimonials.getById(req.params.id);
  if (!testimonial) return res.redirect('/admin/testimonials');
  
  const services = Services.getAll();
  res.render('admin/testimonials/edit', {
    ...getAdminData(),
    title: 'Edit Testimonial',
    testimonial,
    services
  });
});

router.post('/testimonials/:id', requireAuth, upload.single('patient_photo'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.patient_photo = '/uploads/' + req.file.filename;
  }
  Testimonials.update(req.params.id, data);
  res.redirect('/admin/testimonials');
});

router.post('/testimonials/:id/delete', requireAuth, (req, res) => {
  Testimonials.delete(req.params.id);
  res.redirect('/admin/testimonials');
});

// =====================
// Reviews Management
// =====================

router.get('/reviews', requireAuth, (req, res) => {
  const reviews = Reviews.getAll();
  const stats = Reviews.getStats();
  const countBySource = Reviews.getCountBySource();
  const googleSync = GoogleReviewsService.getSyncStatus();
  res.render('admin/reviews/index', {
    ...getAdminData(),
    title: 'Manage Reviews',
    reviews,
    stats,
    countBySource,
    googleSync,
    syncMessage: req.query.syncMessage,
    syncError: req.query.syncError
  });
});

// Sync Google Reviews
router.post('/reviews/sync-google', requireAuth, async (req, res) => {
  try {
    const result = await GoogleReviewsService.importReviews();
    const message = `Synced from ${result.placeName}: ${result.imported} new, ${result.updated} updated, ${result.skipped} skipped. Overall rating: ${result.overallRating}/5 (${result.totalReviews} total reviews)`;
    res.redirect('/admin/reviews?syncMessage=' + encodeURIComponent(message));
  } catch (error) {
    console.error('Google sync error:', error);
    res.redirect('/admin/reviews?syncError=' + encodeURIComponent(error.message));
  }
});

router.get('/reviews/new', requireAuth, (req, res) => {
  res.render('admin/reviews/edit', {
    ...getAdminData(),
    title: 'Add New Review',
    review: null
  });
});

router.post('/reviews', requireAuth, upload.single('reviewer_photo'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.reviewer_photo = '/uploads/' + req.file.filename;
  }
  data.featured = req.body.featured ? 1 : 0;
  Reviews.create(data);
  res.redirect('/admin/reviews');
});

router.get('/reviews/:id/edit', requireAuth, (req, res) => {
  const review = Reviews.getById(req.params.id);
  if (!review) return res.redirect('/admin/reviews');

  res.render('admin/reviews/edit', {
    ...getAdminData(),
    title: 'Edit Review',
    review
  });
});

router.post('/reviews/:id', requireAuth, upload.single('reviewer_photo'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.reviewer_photo = '/uploads/' + req.file.filename;
  }
  data.featured = req.body.featured ? 1 : 0;
  Reviews.update(req.params.id, data);
  res.redirect('/admin/reviews');
});

router.post('/reviews/:id/delete', requireAuth, (req, res) => {
  Reviews.delete(req.params.id);
  res.redirect('/admin/reviews');
});

// =====================
// Contacts/Messages
// =====================

router.get('/contacts', requireAuth, (req, res) => {
  const contacts = Contacts.getAll();
  res.render('admin/contacts/index', {
    ...getAdminData(),
    title: 'Contact Messages',
    contacts
  });
});

router.get('/contacts/:id', requireAuth, (req, res) => {
  const contact = Contacts.getById(req.params.id);
  if (!contact) return res.redirect('/admin/contacts');
  
  // Mark as read
  Contacts.markRead(req.params.id);
  
  res.render('admin/contacts/view', {
    ...getAdminData(),
    title: 'View Message',
    contact
  });
});

router.post('/contacts/:id/delete', requireAuth, (req, res) => {
  Contacts.delete(req.params.id);
  res.redirect('/admin/contacts');
});

// =====================
// Settings
// =====================

router.get('/settings', requireAuth, (req, res) => {
  const allSettings = Settings.getAllSettings();
  res.render('admin/settings', {
    ...getAdminData(),
    title: 'Site Settings',
    allSettings,
    success: req.query.success,
    importSuccess: req.query.imported,
    importError: req.query.error
  });
});

router.post('/settings', requireAuth, upload.fields([
  { name: 'site_logo', maxCount: 1 },
  { name: 'footer_logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'contact_success_image', maxCount: 1 }
]), (req, res) => {
  // Handle checkbox fields - if not present in body, set to 'false'
  const settingsData = { ...req.body };
  if (!settingsData.show_falling_leaves) {
    settingsData.show_falling_leaves = 'false';
  }
  if (!settingsData.footer_location1_show_phone) {
    settingsData.footer_location1_show_phone = 'false';
  }
  // Handle file uploads
  if (req.files) {
    if (req.files.site_logo && req.files.site_logo[0]) {
      settingsData.site_logo = '/uploads/' + req.files.site_logo[0].filename;
    }
    if (req.files.footer_logo && req.files.footer_logo[0]) {
      settingsData.footer_logo = '/uploads/' + req.files.footer_logo[0].filename;
    }
    if (req.files.favicon && req.files.favicon[0]) {
      settingsData.favicon = '/uploads/' + req.files.favicon[0].filename;
    }
    if (req.files.contact_success_image && req.files.contact_success_image[0]) {
      settingsData.contact_success_image = '/uploads/' + req.files.contact_success_image[0].filename;
    }
  }
  Settings.updateSettings(settingsData);
  res.redirect('/admin/settings?success=1');
});

// Test email configuration
router.post('/test-email', requireAuth, async (req, res) => {
  try {
    const result = await EmailService.testEmailConfig();
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// =====================
// Backup & Restore
// =====================

// Export all data as JSON
router.get('/export', requireAuth, (req, res) => {
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    settings: Settings.getSettings(),
    pages: Pages.getAll(),
    posts: Posts.getAll(),
    services: Services.getAll(),
    team: Team.getAll(),
    testimonials: Testimonials.getAll(),
    categories: Categories.getAll(),
    reviews: Reviews.getAll(),
    insurance: Insurance.getAll()
  };

  const filename = `dentalogix-backup-${new Date().toISOString().split('T')[0]}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(exportData, null, 2));
});

// Import data from JSON
router.post('/import', requireAuth, upload.single('backup_file'), (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/admin/settings?error=No file uploaded');
    }

    const fs = require('fs');
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const importData = JSON.parse(fileContent);

    // Validate the backup file
    if (!importData.version || !importData.settings) {
      fs.unlinkSync(req.file.path);
      return res.redirect('/admin/settings?error=Invalid backup file format');
    }

    // Import settings
    if (importData.settings) {
      Settings.updateSettings(importData.settings);
    }

    // Import pages (update existing or create new)
    if (importData.pages && Array.isArray(importData.pages)) {
      importData.pages.forEach(page => {
        const existing = Pages.getBySlug(page.slug);
        if (existing) {
          Pages.update(existing.id, page);
        } else {
          Pages.create(page);
        }
      });
    }

    // Import posts
    if (importData.posts && Array.isArray(importData.posts)) {
      importData.posts.forEach(post => {
        const existing = Posts.getBySlug(post.slug);
        if (existing) {
          Posts.update(existing.id, post);
        } else {
          Posts.create(post);
        }
      });
    }

    // Import services
    if (importData.services && Array.isArray(importData.services)) {
      importData.services.forEach(service => {
        const existing = Services.getBySlug(service.slug);
        if (existing) {
          Services.update(existing.id, service);
        } else {
          Services.create(service);
        }
      });
    }

    // Import team members
    if (importData.team && Array.isArray(importData.team)) {
      importData.team.forEach(member => {
        const existing = Team.getBySlug(member.slug);
        if (existing) {
          Team.update(existing.id, member);
        } else {
          Team.create(member);
        }
      });
    }

    // Import testimonials
    if (importData.testimonials && Array.isArray(importData.testimonials)) {
      importData.testimonials.forEach(testimonial => {
        const existing = Testimonials.getById(testimonial.id);
        if (existing) {
          Testimonials.update(testimonial.id, testimonial);
        } else {
          Testimonials.create(testimonial);
        }
      });
    }

    // Import categories
    if (importData.categories && Array.isArray(importData.categories)) {
      importData.categories.forEach(category => {
        const existing = Categories.getBySlug(category.slug);
        if (existing) {
          Categories.update(existing.id, category);
        } else {
          Categories.create(category);
        }
      });
    }

    // Import reviews
    if (importData.reviews && Array.isArray(importData.reviews)) {
      importData.reviews.forEach(review => {
        const existing = Reviews.getById(review.id);
        if (existing) {
          Reviews.update(review.id, review);
        } else {
          Reviews.create(review);
        }
      });
    }

    // Import insurance providers
    if (importData.insurance && Array.isArray(importData.insurance)) {
      importData.insurance.forEach(ins => {
        const existing = Insurance.getById(ins.id);
        if (existing) {
          Insurance.update(ins.id, ins);
        } else {
          Insurance.create(ins);
        }
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.redirect('/admin/settings?success=1&imported=1');
  } catch (error) {
    console.error('Import error:', error);
    res.redirect('/admin/settings?error=Import failed: ' + error.message);
  }
});

// =====================
// Marketing - Offers/Promos
// =====================

router.get('/marketing/offers', requireAuth, (req, res) => {
  const offers = Offers.getAll();
  const stats = Offers.getStats();
  res.render('admin/marketing/offers/index', {
    ...getAdminData(),
    title: 'Offers & Promos',
    offers,
    stats
  });
});

router.get('/marketing/offers/new', requireAuth, (req, res) => {
  res.render('admin/marketing/offers/edit', {
    ...getAdminData(),
    title: 'Create New Offer',
    offer: null
  });
});

const offerUpload = upload.fields([
  { name: 'featured_image', maxCount: 1 },
  { name: 'background_image', maxCount: 1 },
  { name: 'og_image', maxCount: 1 }
]);

router.post('/marketing/offers', requireAuth, offerUpload, (req, res) => {
  const data = { ...req.body };
  if (req.files) {
    if (req.files.featured_image && req.files.featured_image[0]) {
      data.featured_image = '/uploads/' + req.files.featured_image[0].filename;
    }
    if (req.files.background_image && req.files.background_image[0]) {
      data.background_image = '/uploads/' + req.files.background_image[0].filename;
    }
    if (req.files.og_image && req.files.og_image[0]) {
      data.og_image = '/uploads/' + req.files.og_image[0].filename;
    }
  }
  Offers.create(data);
  res.redirect('/admin/marketing/offers');
});

router.get('/marketing/offers/:id/edit', requireAuth, (req, res) => {
  const offer = Offers.getById(req.params.id);
  if (!offer) return res.redirect('/admin/marketing/offers');

  res.render('admin/marketing/offers/edit', {
    ...getAdminData(),
    title: 'Edit Offer',
    offer
  });
});

router.post('/marketing/offers/:id', requireAuth, offerUpload, (req, res) => {
  const existing = Offers.getById(req.params.id);
  if (!existing) return res.redirect('/admin/marketing/offers');

  const data = { ...req.body };
  if (req.files) {
    if (req.files.featured_image && req.files.featured_image[0]) {
      data.featured_image = '/uploads/' + req.files.featured_image[0].filename;
    } else {
      data.featured_image = existing.featured_image;
    }
    if (req.files.background_image && req.files.background_image[0]) {
      data.background_image = '/uploads/' + req.files.background_image[0].filename;
    } else {
      data.background_image = existing.background_image;
    }
    if (req.files.og_image && req.files.og_image[0]) {
      data.og_image = '/uploads/' + req.files.og_image[0].filename;
    } else {
      data.og_image = existing.og_image;
    }
  }
  Offers.update(req.params.id, data);
  res.redirect('/admin/marketing/offers');
});

router.post('/marketing/offers/:id/delete', requireAuth, (req, res) => {
  Offers.delete(req.params.id);
  res.redirect('/admin/marketing/offers');
});

// =====================
// Marketing - Leads
// =====================

router.get('/marketing/leads', requireAuth, (req, res) => {
  const leads = Leads.getAll();
  const stats = Leads.getStats();
  res.render('admin/marketing/leads/index', {
    ...getAdminData(),
    title: 'Lead Management',
    leads,
    stats
  });
});

router.get('/marketing/leads/:id', requireAuth, (req, res) => {
  const lead = Leads.getById(req.params.id);
  if (!lead) return res.redirect('/admin/marketing/leads');

  res.render('admin/marketing/leads/view', {
    ...getAdminData(),
    title: 'Lead Details',
    lead
  });
});

router.post('/marketing/leads/:id/status', requireAuth, (req, res) => {
  const { status, notes } = req.body;
  Leads.updateStatus(req.params.id, status, notes);
  res.redirect('/admin/marketing/leads/' + req.params.id);
});

router.post('/marketing/leads/:id/delete', requireAuth, (req, res) => {
  Leads.delete(req.params.id);
  res.redirect('/admin/marketing/leads');
});

// =====================
// Marketing - Social Media
// =====================

router.get('/marketing/social', requireAuth, (req, res) => {
  const offers = Offers.getAll().filter(o => o.status === 'published');
  const brandscript = BrandScripts.getDefault();
  const posts = SocialPosts.getAll();
  const stats = SocialPosts.getStats();

  res.render('admin/marketing/social/index', {
    ...getAdminData(),
    title: 'Social Media Posts',
    offers,
    brandscript: brandscript ? BrandScripts.parseJsonFields(brandscript) : null,
    posts,
    stats
  });
});

router.post('/marketing/social/generate', requireAuth, (req, res) => {
  const { offer_id } = req.body;
  let platforms = req.body['platforms[]'];

  if (!platforms) platforms = ['facebook', 'instagram', 'twitter'];
  if (!Array.isArray(platforms)) platforms = [platforms];

  const offer = Offers.getById(offer_id);
  const brandscript = BrandScripts.getDefault();

  if (!offer || !brandscript) {
    return res.redirect('/admin/marketing/social');
  }

  // Generate posts
  const generatedPosts = SocialPosts.generatePosts(offer, brandscript, platforms);

  // Save each post
  generatedPosts.forEach(post => {
    SocialPosts.create(post);
  });

  res.redirect('/admin/marketing/social');
});

router.post('/marketing/social/:id/posted', requireAuth, (req, res) => {
  SocialPosts.markPosted(req.params.id);
  res.redirect('/admin/marketing/social');
});

router.post('/marketing/social/:id/delete', requireAuth, (req, res) => {
  SocialPosts.delete(req.params.id);
  res.redirect('/admin/marketing/social');
});

// =====================
// Marketing - BrandScript (StoryBrand)
// =====================

router.get('/marketing/brandscript', requireAuth, (req, res) => {
  // Get or create default brandscript
  let brandscript = BrandScripts.getDefault();
  if (brandscript) {
    brandscript = BrandScripts.parseJsonFields(brandscript);
  }

  res.render('admin/marketing/brandscript/edit', {
    ...getAdminData(),
    title: 'StoryBrand BrandScript',
    brandscript
  });
});

router.post('/marketing/brandscript', requireAuth, (req, res) => {
  const data = processBrandScriptForm(req.body);
  data.is_active = true;

  const id = BrandScripts.create(data);
  res.redirect('/admin/marketing/brandscript');
});

router.post('/marketing/brandscript/:id', requireAuth, (req, res) => {
  const existing = BrandScripts.getById(req.params.id);
  if (!existing) return res.redirect('/admin/marketing/brandscript');

  const data = processBrandScriptForm(req.body);
  data.is_active = existing.is_active;

  BrandScripts.update(req.params.id, data);
  res.redirect('/admin/marketing/brandscript');
});

// Helper function to process form arrays into JSON
function processBrandScriptForm(body) {
  const data = { ...body };

  // Process array fields
  const arrayFields = [
    'guide_authority_stats',
    'guide_testimonials',
    'guide_awards',
    'guide_logos',
    'process_plan_steps',
    'agreement_plan_items',
    'failure_consequences',
    'success_outcomes'
  ];

  arrayFields.forEach(field => {
    const values = body[field + '[]'];
    if (values) {
      const arr = Array.isArray(values) ? values : [values];
      data[field] = arr.filter(v => v && v.trim());
    } else {
      data[field] = [];
    }
    delete data[field + '[]'];
  });

  // Process transitional CTAs (multiple fields)
  const ctaNames = body['transitional_cta_name[]'];
  const ctaTypes = body['transitional_cta_type[]'];
  const ctaUrls = body['transitional_cta_url[]'];

  if (ctaNames) {
    const names = Array.isArray(ctaNames) ? ctaNames : [ctaNames];
    const types = Array.isArray(ctaTypes) ? ctaTypes : [ctaTypes];
    const urls = Array.isArray(ctaUrls) ? ctaUrls : [ctaUrls];

    data.transitional_ctas = names
      .map((name, i) => ({
        name: name,
        type: types[i] || 'pdf',
        url: urls[i] || ''
      }))
      .filter(cta => cta.name && cta.name.trim());
  } else {
    data.transitional_ctas = [];
  }

  delete data['transitional_cta_name[]'];
  delete data['transitional_cta_type[]'];
  delete data['transitional_cta_url[]'];

  return data;
}

// =====================
// Marketing - Quiz Management
// =====================

router.get('/marketing/quiz', requireAuth, (req, res) => {
  const submissions = Quiz.getSubmissions(50, 0);
  const stats = Quiz.getQuizStats();

  res.render('admin/marketing/quiz/index', {
    ...getAdminData(),
    title: 'Quiz Submissions',
    submissions,
    stats
  });
});

router.get('/marketing/quiz/questions', requireAuth, (req, res) => {
  const questions = Quiz.getQuestionsWithOptions();
  const procedures = Quiz.getAllProcedures();

  res.render('admin/marketing/quiz/questions', {
    ...getAdminData(),
    title: 'Quiz Questions',
    questions,
    procedures
  });
});

router.get('/marketing/quiz/questions/new', requireAuth, (req, res) => {
  const procedures = Quiz.getAllProcedures();

  res.render('admin/marketing/quiz/question-edit', {
    ...getAdminData(),
    title: 'Add Question',
    question: null,
    procedures
  });
});

router.post('/marketing/quiz/questions', requireAuth, (req, res) => {
  const { question, subtitle, category, icon, fun_fact, is_multi_select, sort_order } = req.body;

  const questionId = Quiz.createQuestion({
    question,
    subtitle,
    category,
    icon: icon || '⭐',
    fun_fact,
    is_multi_select: is_multi_select ? 1 : 0,
    sort_order: parseInt(sort_order) || 0
  });

  // Process options
  const optionLabels = req.body['option_label[]'];
  const optionEmojis = req.body['option_emoji[]'];
  const optionPoints = req.body['option_points[]'];

  if (optionLabels) {
    const labels = Array.isArray(optionLabels) ? optionLabels : [optionLabels];
    const emojis = Array.isArray(optionEmojis) ? optionEmojis : [optionEmojis];
    const pointsArr = Array.isArray(optionPoints) ? optionPoints : [optionPoints];

    labels.forEach((label, i) => {
      if (label && label.trim()) {
        let points = {};
        try {
          points = JSON.parse(pointsArr[i] || '{}');
        } catch (e) {
          points = {};
        }

        Quiz.createOption({
          question_id: questionId,
          label: label.trim(),
          emoji: emojis[i] || '✓',
          points,
          sort_order: i
        });
      }
    });
  }

  res.redirect('/admin/marketing/quiz/questions');
});

router.get('/marketing/quiz/questions/:id/edit', requireAuth, (req, res) => {
  const question = Quiz.getQuestionById(req.params.id);
  if (!question) return res.redirect('/admin/marketing/quiz/questions');

  const options = Quiz.getOptionsByQuestionId(req.params.id);
  const procedures = Quiz.getAllProcedures();

  res.render('admin/marketing/quiz/question-edit', {
    ...getAdminData(),
    title: 'Edit Question',
    question: { ...question, options },
    procedures
  });
});

router.post('/marketing/quiz/questions/:id', requireAuth, (req, res) => {
  const { question, subtitle, category, icon, fun_fact, is_multi_select, sort_order } = req.body;

  Quiz.updateQuestion(req.params.id, {
    question,
    subtitle,
    category,
    icon: icon || '⭐',
    fun_fact,
    is_multi_select: is_multi_select ? 1 : 0,
    sort_order: parseInt(sort_order) || 0
  });

  // Delete existing options and re-create
  Quiz.deleteOptionsByQuestionId(req.params.id);

  const optionLabels = req.body['option_label[]'];
  const optionEmojis = req.body['option_emoji[]'];
  const optionPoints = req.body['option_points[]'];

  if (optionLabels) {
    const labels = Array.isArray(optionLabels) ? optionLabels : [optionLabels];
    const emojis = Array.isArray(optionEmojis) ? optionEmojis : [optionEmojis];
    const pointsArr = Array.isArray(optionPoints) ? optionPoints : [optionPoints];

    labels.forEach((label, i) => {
      if (label && label.trim()) {
        let points = {};
        try {
          points = JSON.parse(pointsArr[i] || '{}');
        } catch (e) {
          points = {};
        }

        Quiz.createOption({
          question_id: req.params.id,
          label: label.trim(),
          emoji: emojis[i] || '✓',
          points,
          sort_order: i
        });
      }
    });
  }

  res.redirect('/admin/marketing/quiz/questions');
});

router.post('/marketing/quiz/questions/:id/delete', requireAuth, (req, res) => {
  Quiz.deleteQuestion(req.params.id);
  res.redirect('/admin/marketing/quiz/questions');
});

router.get('/marketing/quiz/:id', requireAuth, (req, res) => {
  const submission = Quiz.getSubmissionById(req.params.id);
  if (!submission) return res.redirect('/admin/marketing/quiz');

  const answers = Quiz.getSubmissionAnswers(req.params.id);
  const procedures = Quiz.getAllProcedures();

  // Parse recommendations if stored as JSON string
  let recommendations = [];
  if (submission.recommendations) {
    try {
      recommendations = JSON.parse(submission.recommendations);
    } catch (e) {
      recommendations = [];
    }
  }

  res.render('admin/marketing/quiz/view', {
    ...getAdminData(),
    title: 'Quiz Submission',
    submission,
    answers,
    recommendations,
    procedures
  });
});

// =====================
// Users Management (Admin only)
// =====================

router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = Users.getAll();
  res.render('admin/users/index', {
    ...getAdminData(),
    title: 'Manage Users',
    users
  });
});

router.get('/users/new', requireAuth, requireAdmin, (req, res) => {
  res.render('admin/users/edit', {
    ...getAdminData(),
    title: 'New User',
    editUser: null
  });
});

router.post('/users', requireAuth, requireAdmin, (req, res) => {
  try {
    Users.create(req.body);
    res.redirect('/admin/users');
  } catch (error) {
    res.render('admin/users/edit', {
      ...getAdminData(),
      title: 'New User',
      editUser: null,
      error: 'Username or email already exists'
    });
  }
});

router.get('/users/:id/edit', requireAuth, requireAdmin, (req, res) => {
  const editUser = Users.getById(req.params.id);
  if (!editUser) return res.redirect('/admin/users');
  
  res.render('admin/users/edit', {
    ...getAdminData(),
    title: 'Edit User',
    editUser
  });
});

router.post('/users/:id', requireAuth, requireAdmin, (req, res) => {
  Users.update(req.params.id, req.body);
  res.redirect('/admin/users');
});

router.post('/users/:id/delete', requireAuth, requireAdmin, (req, res) => {
  // Don't allow deleting yourself
  if (parseInt(req.params.id) === req.session.user.id) {
    return res.redirect('/admin/users');
  }
  Users.delete(req.params.id);
  res.redirect('/admin/users');
});

// =====================
// Insurance Providers Management
// =====================

router.get('/insurance', requireAuth, (req, res) => {
  const providers = Insurance.getAll();
  res.render('admin/insurance/index', {
    ...getAdminData(),
    title: 'Insurance Providers',
    providers
  });
});

router.get('/insurance/new', requireAuth, (req, res) => {
  res.render('admin/insurance/edit', {
    ...getAdminData(),
    title: 'Add Insurance Provider',
    provider: null
  });
});

router.post('/insurance', requireAuth, upload.single('logo'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.logo = '/uploads/' + req.file.filename;
  }
  Insurance.create(data);
  res.redirect('/admin/insurance');
});

router.get('/insurance/:id/edit', requireAuth, (req, res) => {
  const provider = Insurance.getById(req.params.id);
  if (!provider) return res.redirect('/admin/insurance');

  res.render('admin/insurance/edit', {
    ...getAdminData(),
    title: 'Edit Insurance Provider',
    provider
  });
});

router.post('/insurance/:id', requireAuth, upload.single('logo'), (req, res) => {
  const provider = Insurance.getById(req.params.id);
  if (!provider) return res.redirect('/admin/insurance');

  const data = { ...req.body };
  if (req.file) {
    data.logo = '/uploads/' + req.file.filename;
  } else {
    data.logo = provider.logo;
  }
  Insurance.update(req.params.id, data);
  res.redirect('/admin/insurance');
});

router.post('/insurance/:id/delete', requireAuth, (req, res) => {
  Insurance.delete(req.params.id);
  res.redirect('/admin/insurance');
});

module.exports = router;
