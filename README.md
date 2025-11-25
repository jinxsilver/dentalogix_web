# Dentalogix - Modern Dental Practice Website with CMS

A beautiful, responsive dental practice website with a full-featured content management system (CMS) built with Node.js, Express, and SQLite.

## 🦷 Features

### Public Website
- Modern, responsive design with beautiful animations
- Homepage with hero, services, team, testimonials, and blog sections
- Services showcase with individual service pages
- Blog with categories and pagination
- Team/staff profiles
- Contact form with message storage
- SEO-friendly URLs and meta tags

### Admin Panel (CMS)
- Dashboard with quick stats and recent activity
- **Pages Management** - Create and edit static pages
- **Blog Posts** - Full blog with categories, excerpts, featured images
- **Services** - Manage dental services with icons, descriptions, pricing
- **Team Members** - Staff profiles with photos and credentials
- **Testimonials** - Patient reviews with ratings
- **Contact Messages** - View and manage form submissions
- **Site Settings** - Update contact info, social links, branding
- **User Management** - Multi-user support with roles (admin/editor)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

1. **Clone/copy the project to your server:**
   ```bash
   cd /var/www  # or your preferred directory
   # Copy the dentalogix folder here
   ```

2. **Install dependencies:**
   ```bash
   cd dentalogix
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env and set a secure SESSION_SECRET
   ```

4. **Initialize the database:**
   ```bash
   npm run init-db
   ```

5. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

6. **Access the site:**
   - Website: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin
   - Default login: `admin` / `admin123`

⚠️ **Change the default password immediately after first login!**

## 🖥️ Server Requirements & Setup

### Minimum Requirements
- 1 CPU core
- 512MB RAM
- 1GB storage
- Ubuntu 20.04+ or similar Linux distro

### Production Server Setup

#### 1. Install Node.js
```bash
# Using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

#### 3. Deploy the Application
```bash
# Create web directory
sudo mkdir -p /var/www/dentalogix
sudo chown $USER:$USER /var/www/dentalogix

# Copy files and install
cd /var/www/dentalogix
npm install --production
npm run init-db

# Start with PM2
pm2 start server.js --name dentalogix
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

#### 4. Setup Nginx Reverse Proxy
```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/dentalogix`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files
    location /uploads {
        alias /var/www/dentalogix/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static files caching
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/dentalogix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6. Configure Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Environment Variables for Production
Update `.env`:
```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=generate-a-long-random-string-here
```

## 📁 Project Structure

```
dentalogix/
├── server.js           # Main Express application
├── package.json        # Dependencies and scripts
├── database.sqlite     # SQLite database (created on init)
├── .env               # Environment variables
├── models/            # Database models
│   ├── db.js
│   ├── pages.js
│   ├── posts.js
│   ├── services.js
│   ├── team.js
│   ├── testimonials.js
│   ├── categories.js
│   ├── contacts.js
│   ├── users.js
│   └── settings.js
├── routes/            # Express routes
│   ├── public.js      # Frontend routes
│   ├── admin.js       # Admin panel routes
│   └── api.js         # API endpoints
├── middleware/        # Custom middleware
│   └── auth.js        # Authentication
├── views/             # EJS templates
│   ├── public/        # Frontend pages
│   ├── admin/         # Admin panel pages
│   └── partials/      # Reusable components
├── public/            # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── uploads/           # User uploaded files
└── scripts/
    └── init-db.js     # Database initialization
```

## 🔧 Customization

### Changing Colors
Edit `public/css/style.css` and update the CSS variables:
```css
:root {
  --color-primary: #0D9488;      /* Teal */
  --color-secondary: #1E293B;    /* Dark slate */
  --color-accent: #F59E0B;       /* Amber */
}
```

Or use the admin panel Settings page to change brand colors.

### Adding New Pages
1. Go to Admin → Pages → Add New Page
2. Fill in title, content (HTML supported), and meta info
3. Set "Show in navigation" to add to the menu

### Customizing Templates
Templates are in `views/` directory using EJS syntax.

## 🔒 Security Notes

1. **Change default credentials immediately**
2. **Use a strong SESSION_SECRET** in production
3. **Enable HTTPS** using Let's Encrypt
4. **Keep Node.js and dependencies updated**
5. **Regular backups** of `database.sqlite` and `uploads/`

## 📦 Backup

### Database Backup
```bash
cp /var/www/dentalogix/database.sqlite /backup/database-$(date +%Y%m%d).sqlite
```

### Full Backup
```bash
tar -czf /backup/dentalogix-$(date +%Y%m%d).tar.gz /var/www/dentalogix
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000
# Kill it or use a different port in .env
```

### Permission issues with uploads
```bash
sudo chown -R www-data:www-data /var/www/dentalogix/uploads
```

### Database locked error
Restart the application - this can happen if multiple processes try to write simultaneously.

## 📄 License

MIT License - Feel free to use for your dental practice!

---

Built with ❤️ for modern dental practices.
