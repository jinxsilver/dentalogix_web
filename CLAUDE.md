# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dentalogix is a full-stack dental practice website with a CMS, built with Node.js, Express, EJS templates, and SQLite (better-sqlite3).

## Commands

```bash
# Install dependencies
npm install

# Initialize database with default data (creates database.sqlite)
npm run init-db

# Development (with hot reload via nodemon)
npm run dev

# Production
npm start
```

The server runs on port 3000 by default. Admin panel is at `/admin` with default credentials `admin` / `admin123`.

## Architecture

### Stack
- **Backend**: Express.js with EJS templating
- **Database**: SQLite via better-sqlite3 (synchronous API)
- **Auth**: Session-based (express-session) with bcryptjs for password hashing
- **Security**: Helmet for headers, sanitize-html for user content

### Route Structure
- `routes/public.js` - Public website routes (/, /about, /services, /blog, /contact)
- `routes/admin.js` - Admin panel CRUD operations for all content types
- `routes/api.js` - JSON API endpoints (limited, mostly for AJAX)

### Models Pattern
All models in `models/` follow the same pattern using synchronous better-sqlite3:
- Export functions like `getAll()`, `getById(id)`, `getBySlug(slug)`, `create(data)`, `update(id, data)`, `delete(id)`
- Use prepared statements for parameterized queries
- `models/db.js` is the shared database connection

### Database Schema
Key tables: `users`, `pages`, `posts`, `categories`, `services`, `team`, `testimonials`, `contacts`, `settings`, `appointments`

### View Organization
```
views/
├── public/          # Frontend pages (home, about, services, blog, contact, page)
├── admin/           # Admin panel (dashboard + CRUD for each entity)
│   └── partials/    # Admin header/footer
└── partials/        # Public header/footer
```

### File Uploads
- Handled by multer in `routes/admin.js`
- Stored in `uploads/` directory
- 5MB limit, images only (jpeg, jpg, png, gif, webp, svg)

## Environment Variables

Copy `.env.example` to `.env`:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - development or production
- `SESSION_SECRET` - Session encryption key (must change in production)
