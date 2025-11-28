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
const Offers = require('../models/offers');
const Leads = require('../models/leads');
const BrandScripts = require('../models/brandscripts');
const Quiz = require('../models/quiz');
const EmailService = require('../services/email');

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

  // Get active BrandScript for StoryBrand sections
  const brandscriptRaw = BrandScripts.getDefault();
  const brandscript = brandscriptRaw ? BrandScripts.parseJsonFields(brandscriptRaw) : null;

  const settings = Settings.getSettings();
  res.render('public/home', {
    ...getCommonData(),
    title: 'Home',
    metaDescription: settings.site_tagline || 'Dentalogix offers professional dental care in Buffalo, NY. Family dentistry, cosmetic dentistry, and emergency dental services. Schedule your appointment today!',
    services,
    testimonials,
    team,
    recentPosts,
    reviews,
    reviewStats,
    insuranceProviders,
    brandscript
  });
});

// About page
router.get('/about', (req, res) => {
  const page = Pages.getBySlug('about');
  const teamGrouped = Team.getPublishedGrouped();

  res.render('public/about', {
    ...getCommonData(),
    title: 'About Us',
    metaDescription: 'Learn about Dentalogix, your trusted dental practice in Buffalo, NY. Meet our experienced team of dentists committed to providing exceptional dental care for your entire family.',
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
    metaDescription: 'Explore our comprehensive dental services including preventive care, cosmetic dentistry, orthodontics, and emergency dental treatment. Quality dental care in Buffalo, NY.',
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
    metaDescription: 'Read our dental health blog for tips on oral hygiene, dental care advice, and the latest news from Dentalogix. Stay informed about your dental health.',
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
    title: 'Our Locations',
    metaDescription: 'Find Dentalogix dental offices near you. Convenient locations in Buffalo, NY and Brooklyn, NY. Easy access to quality dental care for your family.'
  });
});

// Mobile Dentistry page
router.get('/mobile-dentistry', (req, res) => {
  const page = Pages.getBySlug('mobile-dentistry');
  res.render('public/mobile-dentistry', {
    ...getCommonData(),
    page: page,
    title: page ? page.title : 'Mobile Corporate Dentistry',
    metaDescription: 'Dentalogix Mobile Dentistry brings professional dental care directly to your workplace. On-site dental services for corporations, schools, and organizations in the Buffalo area.'
  });
});

// Smile Assessment Quiz page
router.get('/quiz', (req, res) => {
  const questions = Quiz.getQuestionsWithOptions();
  const procedures = Quiz.getAllProcedures();
  const brandscriptRaw = BrandScripts.getDefault();
  const brandscript = brandscriptRaw ? BrandScripts.parseJsonFields(brandscriptRaw) : null;

  res.render('public/quiz', {
    ...getCommonData(),
    title: 'Smile Assessment Quiz',
    metaDescription: 'Take our free 2-minute smile assessment quiz and discover personalized recommendations for your perfect smile. Get expert dental advice tailored to your needs.',
    questions,
    procedures,
    brandscript
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
    metaDescription: 'Contact Dentalogix to schedule your dental appointment. Call us, send a message, or visit our office in Buffalo, NY. We are here to help with all your dental needs.',
    page,
    services,
    success: req.query.success
  });
});

// Contact form submission
router.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    Contacts.create({ name, email, phone, subject, message });

    // Send email notifications (don't wait for completion, don't fail on email errors)
    const contact = { name, email, phone, subject, message };
    EmailService.sendContactNotification(contact).catch(err => console.error('Notification email error:', err));
    EmailService.sendContactConfirmation(contact).catch(err => console.error('Confirmation email error:', err));

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

// Offers/Landing Pages
router.get('/offers/:slug', (req, res) => {
  const offer = Offers.getBySlug(req.params.slug);

  if (!offer || offer.status !== 'published') {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Offer Not Found'
    });
  }

  // Check if offer is within date range
  const now = new Date();
  if (offer.start_date && new Date(offer.start_date) > now) {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Offer Not Found'
    });
  }
  if (offer.end_date && new Date(offer.end_date) < now) {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Offer Expired'
    });
  }

  // Increment view count
  Offers.incrementViews(offer.id);

  // Parse form fields
  const formFields = (offer.form_fields || 'name,email,phone').split(',').map(f => f.trim());

  // Get UTM parameters for tracking
  const utmParams = {
    utm_source: req.query.utm_source || null,
    utm_medium: req.query.utm_medium || null,
    utm_campaign: req.query.utm_campaign || null
  };

  // Get BrandScript for StoryBrand sections
  let brandscript = null;
  let storyBrandContent = null;

  if (offer.brandscript_id) {
    brandscript = BrandScripts.getById(offer.brandscript_id);
  } else {
    // Fall back to default brandscript
    brandscript = BrandScripts.getDefault();
  }

  if (brandscript) {
    storyBrandContent = {
      hero: BrandScripts.generateHeroContent(brandscript),
      stakes: BrandScripts.generateStakesContent(brandscript),
      guide: BrandScripts.generateGuideContent(brandscript),
      plan: BrandScripts.generatePlanContent(brandscript),
      success: BrandScripts.generateSuccessContent(brandscript)
    };
  }

  // Get testimonials for the testimonials section
  const testimonials = Testimonials.getFeatured();

  res.render('public/offer', {
    ...getCommonData(),
    title: offer.meta_title || offer.title,
    offer,
    formFields,
    utmParams,
    success: req.query.success,
    brandscript: brandscript ? BrandScripts.parseJsonFields(brandscript) : null,
    storyBrandContent,
    testimonials
  });
});

// Offer form submission (lead capture)
router.post('/offers/:slug', async (req, res) => {
  const offer = Offers.getBySlug(req.params.slug);

  if (!offer || offer.status !== 'published') {
    return res.status(404).render('404', {
      ...getCommonData(),
      title: 'Offer Not Found'
    });
  }

  const { name, email, phone, message, utm_source, utm_medium, utm_campaign } = req.body;

  try {
    // Create lead
    Leads.create({
      offer_id: offer.id,
      name,
      email,
      phone,
      message,
      source: 'landing_page',
      utm_source,
      utm_medium,
      utm_campaign,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      status: 'new'
    });

    // Increment conversion count
    Offers.incrementConversions(offer.id);

    // Send lead notification email (don't wait, don't fail on errors)
    const lead = { name, email, phone, message, utm_source, utm_medium, utm_campaign };
    EmailService.sendLeadNotification(lead, offer).catch(err => console.error('Lead notification email error:', err));

    res.redirect(`/offers/${offer.slug}?success=1`);
  } catch (error) {
    console.error('Lead capture error:', error);
    const formFields = (offer.form_fields || 'name,email,phone').split(',').map(f => f.trim());
    res.render('public/offer', {
      ...getCommonData(),
      title: offer.meta_title || offer.title,
      offer,
      formFields,
      utmParams: { utm_source, utm_medium, utm_campaign },
      error: 'There was an error. Please try again.'
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

// Sitemap.xml for SEO
router.get('/sitemap.xml', (req, res) => {
  const settings = Settings.getSettings();
  const baseUrl = settings.site_url || 'https://dentalogix.us';

  // Get all content for sitemap
  const pages = Pages.getAll().filter(p => p.status === 'published');
  const posts = Posts.getAll().filter(p => p.status === 'published');
  const services = Services.getAll();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/services', priority: '0.9', changefreq: 'weekly' },
    { url: '/locations', priority: '0.8', changefreq: 'monthly' },
    { url: '/mobile-dentistry', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog', priority: '0.8', changefreq: 'daily' },
    { url: '/contact', priority: '0.8', changefreq: 'monthly' }
  ];

  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  // Dynamic pages
  pages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/page/${page.slug}</loc>\n`;
    xml += `    <lastmod>${new Date(page.updated_at || page.created_at).toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  });

  // Blog posts
  posts.forEach(post => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
    xml += `    <lastmod>${new Date(post.updated_at || post.published_at || post.created_at).toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  });

  // Services
  services.forEach(service => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/services/${service.slug}</loc>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

module.exports = router;
