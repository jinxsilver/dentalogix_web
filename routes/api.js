const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');

// Models
const Settings = require('../models/settings');
const Pages = require('../models/pages');
const Posts = require('../models/posts');
const Services = require('../models/services');
const Contacts = require('../models/contacts');
const Quiz = require('../models/quiz');
const EmailService = require('../services/email');

// ======================
// Zod Validation Schemas
// ======================

const quizSubmissionSchema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  email: z.string().email().max(255).optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
  answers: z.array(z.object({
    questionId: z.number().int().positive(),
    selected: z.union([z.string(), z.array(z.string())])
  })).optional(),
  smileType: z.string().max(50).optional(),
  smileTypeName: z.string().max(100).optional(),
  recommendations: z.array(z.object({
    key: z.string(),
    score: z.number()
  })).optional(),
  timeline: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  primaryInterest: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  // UTM tracking parameters
  utm_source: z.string().max(100).optional().nullable(),
  utm_medium: z.string().max(100).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable()
});

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000)
});

// Validation middleware helper
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

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
router.post('/contact', validate(contactSchema), (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    Contacts.create({ name, email, phone, subject, message });
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending message' });
  }
});

// Submit quiz results
router.post('/quiz/submit', validate(quizSubmissionSchema), async (req, res) => {
  try {
    const {
      firstName,
      email,
      phone,
      answers,
      smileType,
      smileTypeName,
      recommendations,
      timeline,
      primaryInterest,
      utm_source,
      utm_medium,
      utm_campaign
    } = req.body;

    // Create submission
    const submissionId = Quiz.createSubmission({
      first_name: firstName,
      email: email,
      phone: phone,
      smile_type: smileType,
      smile_type_name: smileTypeName,
      recommendations: recommendations,
      timeline: Array.isArray(timeline) ? timeline.join(', ') : timeline,
      primary_interest: Array.isArray(primaryInterest) ? primaryInterest.join(', ') : primaryInterest,
      source: 'website',
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Save individual answers
    if (answers && Array.isArray(answers)) {
      for (const answer of answers) {
        Quiz.createAnswer({
          submission_id: submissionId,
          question_id: answer.questionId,
          selected_options: Array.isArray(answer.selected) ? answer.selected : [answer.selected]
        });
      }
    }

    // Send notification email
    if (email || firstName) {
      try {
        const settings = Settings.getSettings();
        await EmailService.sendQuizNotification({
          to: settings.email || 'info@dentalogix.us',
          firstName: firstName || 'Anonymous',
          email: email || 'Not provided',
          phone: phone || 'Not provided',
          smileType: smileTypeName,
          recommendations: recommendations,
          timeline: timeline,
          primaryInterest: primaryInterest
        });
        Quiz.markNotificationSent(submissionId);
      } catch (emailError) {
        console.error('Failed to send quiz notification:', emailError);
      }
    }

    res.json({ success: true, submissionId });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ success: false, message: 'Error saving quiz results' });
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

// ======================
// Quiz Admin API Endpoints
// ======================

// Get quiz submissions (admin)
router.get('/quiz/submissions', requireAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const submissions = Quiz.getSubmissions(limit, offset);
    const total = Quiz.countSubmissions();

    res.json({
      success: true,
      data: submissions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + submissions.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    res.status(500).json({ success: false, message: 'Error fetching submissions' });
  }
});

// Get single quiz submission (admin)
router.get('/quiz/submissions/:id', requireAuth, (req, res) => {
  try {
    const submission = Quiz.getSubmissionById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const answers = Quiz.getSubmissionAnswers(req.params.id);

    // Parse recommendations if stored as JSON string
    let recommendations = [];
    if (submission.recommendations) {
      try {
        recommendations = JSON.parse(submission.recommendations);
      } catch (e) {
        recommendations = [];
      }
    }

    res.json({
      success: true,
      data: {
        ...submission,
        recommendations,
        answers
      }
    });
  } catch (error) {
    console.error('Error fetching quiz submission:', error);
    res.status(500).json({ success: false, message: 'Error fetching submission' });
  }
});

// Get quiz stats (admin)
router.get('/quiz/stats', requireAuth, (req, res) => {
  try {
    const stats = Quiz.getQuizStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// Get quiz questions (public - for loading quiz)
router.get('/quiz/questions', (req, res) => {
  try {
    const questions = Quiz.getQuestionsWithOptions();
    const procedures = Quiz.getAllProcedures();
    res.json({ success: true, data: { questions, procedures } });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ success: false, message: 'Error fetching questions' });
  }
});

module.exports = router;
