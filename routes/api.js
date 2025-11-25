const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Models
const Settings = require('../models/settings');
const Pages = require('../models/pages');
const Posts = require('../models/posts');
const Services = require('../models/services');
const Contacts = require('../models/contacts');

// Public API endpoints

// Get services
router.get('/services', (req, res) => {
  const services = Services.getPublished();
  res.json(services);
});

// Get recent posts
router.get('/posts/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const posts = Posts.getRecent(limit);
  res.json(posts);
});

// Submit contact form
router.post('/contact', (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    Contacts.create({ name, email, phone, subject, message });
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

// Admin API endpoints (protected)

// Upload image
router.post('/upload', requireAuth, (req, res) => {
  // This would handle file uploads via AJAX
  // For now, returning a placeholder
  res.json({ success: true, url: '/uploads/placeholder.jpg' });
});

// Update page order
router.post('/pages/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // Array of { id, sort_order }
  try {
    // Would implement reordering logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Get unread contacts count
router.get('/contacts/unread-count', requireAuth, (req, res) => {
  const count = Contacts.countUnread();
  res.json({ count });
});

module.exports = router;
