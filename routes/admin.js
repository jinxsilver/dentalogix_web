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
const GoogleReviewsService = require('../services/googleReviews');

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
  settings: Settings.getSettings()
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
  { name: 'about_image_secondary', maxCount: 1 }
]);

router.post('/pages/home', requireAuth, homeUpload, (req, res) => {
  const settingsData = {};
  if (req.files) {
    if (req.files.about_image_main && req.files.about_image_main[0]) {
      settingsData.about_image_main = '/uploads/' + req.files.about_image_main[0].filename;
    }
    if (req.files.about_image_secondary && req.files.about_image_secondary[0]) {
      settingsData.about_image_secondary = '/uploads/' + req.files.about_image_secondary[0].filename;
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
  const data = { ...req.body };
  if (req.file) {
    data.image = '/uploads/' + req.file.filename;
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
  { name: 'favicon', maxCount: 1 }
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
  }
  Settings.updateSettings(settingsData);
  res.redirect('/admin/settings?success=1');
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
