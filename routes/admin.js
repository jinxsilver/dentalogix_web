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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
    error: null
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
      error: 'Invalid username or password'
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
  
  res.render('admin/dashboard', {
    ...getAdminData(),
    title: 'Dashboard',
    stats,
    recentContacts,
    recentPosts
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

router.post('/pages/:id', requireAuth, upload.single('hero_image'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.hero_image = '/uploads/' + req.file.filename;
  }
  Pages.update(req.params.id, data);
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

router.post('/team', requireAuth, upload.single('photo'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.photo = '/uploads/' + req.file.filename;
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

router.post('/team/:id', requireAuth, upload.single('photo'), (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.photo = '/uploads/' + req.file.filename;
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
    success: req.query.success
  });
});

router.post('/settings', requireAuth, (req, res) => {
  Settings.updateSettings(req.body);
  res.redirect('/admin/settings?success=1');
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

module.exports = router;
