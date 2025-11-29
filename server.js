require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for IIS/reverse proxy to handle sessions correctly)
app.set('trust proxy', 1);

// Security & Performance
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.pexels.com", "https://images.unsplash.com", "https://*.nyu.edu", "https://*.buffalo.edu", "https://*.ucf.edu", "https://*.harvard.edu", "https://*.edu"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dentalogix-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make session available to views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    settings: require('./models/settings').getSettings(),
    navPages: require('./models/pages').getNavPages()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
    settings: require('./models/settings').getSettings(),
    navPages: require('./models/pages').getNavPages()
  });
});

app.listen(PORT, () => {
  console.log(`🦷 Dentalogix server running at http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);

  // Start background schedulers
  const Scheduler = require('./lib/scheduler');
  Scheduler.startGoogleReviewsSync(24); // Sync Google reviews every 24 hours
});
