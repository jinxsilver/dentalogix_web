// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/admin/login');
  }
  next();
};

// Admin role check
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('admin/error', {
      title: 'Access Denied',
      message: 'You do not have permission to access this resource.'
    });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
