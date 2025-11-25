const express = require('express');
const router = express.Router();
const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

// Models
const Settings = require('../models/settings');
const Pages = require('../models/pages');
const Posts = require('../models/posts');
const Services = require('../models/services');
const Team = require('../models/team');
const Testimonials = require('../models/testimonials');
const Categories = require('../models/categories');
const Contacts = require('../models/contacts');
const Reviews = require('../models/reviews');
const Insurance = require('../models/insurance');

// Helper to get common data
const getCommonData = () => ({
  settings: Settings.getSettings(),
  navPages: Pages.getNavPages()
});

// Home page
router.get('/', (req, res) => {
  const services = Services.getFeatured();
  const testimonials = Testimonials.getFeatured();
  const team = Team.getPublished();
  const recentPosts = Posts.getRecent(3);
  const reviews = Reviews.getFeatured();
  const reviewStats = Reviews.getStats();
  const insuranceProviders = Insurance.getPublished();

  res.render('public/home', {
    ...getCommonData(),
    title: 'Home',
    services,
    testimonials,
    team,
    recentPosts,
    reviews,
    reviewStats,
    insuranceProviders
  });
});

// About page
router.get('/about', (req, res) => {
  const page = Pages.getBySlug('about');
  const teamGrouped = Team.getPublishedGrouped();

  res.render('public/about', {
    ...getCommonData(),
    title: 'About Us',
    page,
    team: Team.getPublished(),
    teamGrouped
  });
});

// Team member bio page
router.get('/team/:slug', (req, res) => {
  const member = Team.getBySlug(req.params.slug);

  if (!member || !member.bio_page_enabled) {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Team Member Not Found'
    });
  }

  res.render('public/team-member', {
    ...getCommonData(),
    title: member.name,
    member
  });
});

// Services listing
router.get('/services', (req, res) => {
  const services = Services.getPublished();
  
  res.render('public/services', {
    ...getCommonData(),
    title: 'Our Services',
    services
  });
});

// Single service
router.get('/services/:slug', (req, res) => {
  const service = Services.getBySlug(req.params.slug);
  
  if (!service) {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Service Not Found'
    });
  }
  
  const allServices = Services.getPublished();
  
  res.render('public/service-single', {
    ...getCommonData(),
    title: service.title,
    service,
    allServices
  });
});

// Blog listing
router.get('/blog', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const offset = (page - 1) * limit;
  
  const posts = Posts.getPublished(limit, offset);
  const totalPosts = Posts.count();
  const totalPages = Math.ceil(totalPosts / limit);
  const categories = Categories.getAll();
  
  res.render('public/blog', {
    ...getCommonData(),
    title: 'Blog',
    posts,
    categories,
    currentPage: page,
    totalPages
  });
});

// Blog category
router.get('/blog/category/:slug', (req, res) => {
  const category = Categories.getBySlug(req.params.slug);
  
  if (!category) {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Category Not Found'
    });
  }
  
  const posts = Posts.getByCategory(req.params.slug);
  const categories = Categories.getAll();
  
  res.render('public/blog', {
    ...getCommonData(),
    title: `Category: ${category.name}`,
    posts,
    categories,
    category,
    currentPage: 1,
    totalPages: 1
  });
});

// Single blog post
router.get('/blog/:slug', (req, res) => {
  const post = Posts.getBySlug(req.params.slug);
  
  if (!post || post.status !== 'published') {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Post Not Found'
    });
  }
  
  // Convert markdown content to HTML
  post.htmlContent = sanitizeHtml(marked(post.content || ''), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3'])
  });
  
  const recentPosts = Posts.getRecent(5);
  const categories = Categories.getAll();
  
  res.render('public/post-single', {
    ...getCommonData(),
    title: post.title,
    post,
    recentPosts,
    categories
  });
});

// Locations page
router.get('/locations', (req, res) => {
  res.render('public/locations', {
    ...getCommonData(),
    title: 'Our Locations'
  });
});

// Mobile Dentistry page
router.get('/mobile-dentistry', (req, res) => {
  res.render('public/mobile-dentistry', {
    ...getCommonData(),
    title: 'Mobile Corporate Dentistry'
  });
});

// Logo options page (temporary for review)
router.get('/logo-options', (req, res) => {
  res.render('public/logo-options', {
    ...getCommonData(),
    title: 'Logo Options'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  const page = Pages.getBySlug('contact');
  const services = Services.getPublished();
  
  res.render('public/contact', {
    ...getCommonData(),
    title: 'Contact Us',
    page,
    services,
    success: req.query.success
  });
});

// Contact form submission
router.post('/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  try {
    Contacts.create({ name, email, phone, subject, message });
    res.redirect('/contact?success=1');
  } catch (error) {
    console.error('Contact form error:', error);
    res.render('public/contact', {
      ...getCommonData(),
      title: 'Contact Us',
      page: Pages.getBySlug('contact'),
      services: Services.getPublished(),
      error: 'There was an error submitting your message. Please try again.'
    });
  }
});

// Dynamic pages
router.get('/:slug', (req, res, next) => {
  const page = Pages.getBySlug(req.params.slug);
  
  if (!page || page.status !== 'published') {
    return next();
  }
  
  // Convert content if markdown
  page.htmlContent = sanitizeHtml(marked(page.content || ''), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3'])
  });
  
  res.render('public/page', {
    ...getCommonData(),
    title: page.title,
    page
  });
});

module.exports = router;
