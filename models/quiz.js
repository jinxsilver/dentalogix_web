const db = require('./db');

// Initialize quiz tables
const initQuizTables = () => {
  // Quiz questions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      subtitle TEXT,
      category TEXT NOT NULL,
      icon TEXT DEFAULT '⭐',
      fun_fact TEXT,
      is_multi_select INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Quiz options table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      emoji TEXT DEFAULT '✓',
      points TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
    )
  `);

  // Quiz submissions table (leads)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      email TEXT,
      phone TEXT,
      smile_type TEXT,
      smile_type_name TEXT,
      recommendations TEXT,
      timeline TEXT,
      primary_interest TEXT,
      source TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      ip_address TEXT,
      user_agent TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notification_sent INTEGER DEFAULT 0
    )
  `);

  // Quiz answers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_options TEXT NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES quiz_submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
    )
  `);

  // Dental procedures table (for recommendations)
  db.exec(`
    CREATE TABLE IF NOT EXISTS dental_procedures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      timeframe TEXT,
      icon TEXT DEFAULT '🦷',
      color_gradient TEXT DEFAULT 'from-teal-400 to-cyan-500',
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Seed default questions if empty
  const questionCount = db.prepare('SELECT COUNT(*) as count FROM quiz_questions').get();
  if (questionCount.count === 0) {
    seedDefaultQuestions();
  }

  // Seed default procedures if empty
  const procedureCount = db.prepare('SELECT COUNT(*) as count FROM dental_procedures').get();
  if (procedureCount.count === 0) {
    seedDefaultProcedures();
  }
};

// Seed default quiz questions
const seedDefaultQuestions = () => {
  const questions = [
    {
      question: "What's your #1 smile goal right now?",
      subtitle: "Everyone's smile journey is unique — let's find yours!",
      category: "goals",
      icon: "⭐",
      fun_fact: "Did you know? 48% of adults say a smile is the most memorable feature when meeting someone new!",
      is_multi_select: 0,
      options: [
        { label: "A brighter, whiter smile", emoji: "✨", points: { whitening: 3, veneers: 1 } },
        { label: "Straighter teeth", emoji: "📐", points: { invisalign: 3, veneers: 1 } },
        { label: "Healthier gums & teeth", emoji: "💪", points: { preventive: 3, deepCleaning: 2 } },
        { label: "Replace missing teeth", emoji: "🦷", points: { implants: 3, bridges: 2 } },
        { label: "Just feel more confident", emoji: "😊", points: { cosmetic: 2, whitening: 1, invisalign: 1 } }
      ]
    },
    {
      question: "How would you describe your smile right now?",
      subtitle: "Be honest — no judgment here! This helps us help you.",
      category: "current",
      icon: "😊",
      fun_fact: "You're not alone! Studies show 57% of Americans cover their mouth when they laugh.",
      is_multi_select: 0,
      options: [
        { label: "I love it! Just want to maintain", emoji: "🥰", points: { preventive: 3 } },
        { label: "It's okay, room for improvement", emoji: "🤔", points: { cosmetic: 1, whitening: 1 } },
        { label: "I hide it in photos", emoji: "🫣", points: { cosmetic: 2, veneers: 1, invisalign: 1 } },
        { label: "I avoid smiling altogether", emoji: "😔", points: { cosmetic: 3, fullMakeover: 2 } }
      ]
    },
    {
      question: "Let's talk about tooth color...",
      subtitle: "Coffee lovers, wine enthusiasts — we see you!",
      category: "color",
      icon: "☀️",
      fun_fact: "Good news! Professional whitening can lighten teeth up to 8 shades in just one visit!",
      is_multi_select: 0,
      options: [
        { label: "Pretty white and bright", emoji: "⭐", points: { preventive: 2 } },
        { label: "Slightly yellow/dull", emoji: "🌤️", points: { whitening: 2 } },
        { label: "Noticeably stained", emoji: "🌥️", points: { whitening: 3, veneers: 1 } },
        { label: "Dark spots or discoloration", emoji: "☁️", points: { whitening: 2, veneers: 2, bonding: 1 } }
      ]
    },
    {
      question: "How about the alignment of your teeth?",
      subtitle: "Perfectly imperfect? Or imperfectly perfect?",
      category: "alignment",
      icon: "⚡",
      fun_fact: "Clear aligners have helped over 14 million people straighten their smiles — often in under a year!",
      is_multi_select: 0,
      options: [
        { label: "Pretty straight", emoji: "✅", points: { preventive: 2 } },
        { label: "Minor crowding or gaps", emoji: "↔️", points: { invisalign: 2, bonding: 1 } },
        { label: "Moderate crookedness", emoji: "〰️", points: { invisalign: 3 } },
        { label: "Significant alignment issues", emoji: "🔀", points: { invisalign: 3, orthodontics: 2 } }
      ]
    },
    {
      question: "Any of these bothering you?",
      subtitle: "Select all that apply — it's like a dental wishlist!",
      category: "concerns",
      icon: "❤️",
      fun_fact: "Dental bonding can fix chips in just 30-60 minutes per tooth — often in a single visit!",
      is_multi_select: 1,
      options: [
        { label: "Chips or cracks", emoji: "💔", points: { bonding: 2, veneers: 2 } },
        { label: "Gaps between teeth", emoji: "🦷", points: { invisalign: 2, bonding: 1, veneers: 1 } },
        { label: "Gummy smile", emoji: "😁", points: { gumContouring: 3 } },
        { label: "Worn down teeth", emoji: "📉", points: { crowns: 2, veneers: 2 } },
        { label: "Uneven tooth shapes", emoji: "📊", points: { bonding: 2, veneers: 2 } },
        { label: "None of these!", emoji: "🎉", points: { preventive: 2 } }
      ]
    },
    {
      question: "How are your gums feeling?",
      subtitle: "Gum health = smile health. Let's check in!",
      category: "health",
      icon: "🛡️",
      fun_fact: "Healthy gums shouldn't bleed! If yours do, don't worry — it's usually reversible with proper care.",
      is_multi_select: 0,
      options: [
        { label: "Pink, healthy, no bleeding", emoji: "💗", points: { preventive: 3 } },
        { label: "Occasional bleeding when brushing", emoji: "🩹", points: { deepCleaning: 2, preventive: 1 } },
        { label: "Sensitive or puffy gums", emoji: "😬", points: { deepCleaning: 3, periodontal: 1 } },
        { label: "Receding gumline", emoji: "📉", points: { periodontal: 3, gumContouring: 1 } }
      ]
    },
    {
      question: "When's your ideal smile transformation?",
      subtitle: "Big event coming up? Or taking your time?",
      category: "timeline",
      icon: "✨",
      fun_fact: "Zoom whitening takes just 45 minutes! Perfect for wedding season or big presentations.",
      is_multi_select: 0,
      options: [
        { label: "ASAP — I have an event!", emoji: "🚀", points: { whitening: 2, bonding: 1 } },
        { label: "Within 3-6 months", emoji: "📆", points: { invisalign: 1, veneers: 1 } },
        { label: "Within a year", emoji: "🗓️", points: { invisalign: 2, fullMakeover: 1 } },
        { label: "No rush — whenever it's right", emoji: "🧘", points: { preventive: 1 } }
      ]
    },
    {
      question: "Last one! How do you feel about dental visits?",
      subtitle: "Honest answers only — we've heard it all!",
      category: "experience",
      icon: "❤️",
      fun_fact: "Dental anxiety is SUPER common — and modern dentistry has amazing comfort options. You're in good hands!",
      is_multi_select: 0,
      options: [
        { label: "I actually enjoy them!", emoji: "😍", points: { preventive: 2 } },
        { label: "They're fine, no big deal", emoji: "👍", points: { preventive: 1 } },
        { label: "A little nervous", emoji: "😅", points: { sedation: 1 } },
        { label: "Pretty anxious, honestly", emoji: "😰", points: { sedation: 2, anxietyFree: 2 } }
      ]
    }
  ];

  const insertQuestion = db.prepare(`
    INSERT INTO quiz_questions (question, subtitle, category, icon, fun_fact, is_multi_select, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOption = db.prepare(`
    INSERT INTO quiz_options (question_id, label, emoji, points, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  questions.forEach((q, qIndex) => {
    const result = insertQuestion.run(q.question, q.subtitle, q.category, q.icon, q.fun_fact, q.is_multi_select, qIndex);
    const questionId = result.lastInsertRowid;

    q.options.forEach((opt, optIndex) => {
      insertOption.run(questionId, opt.label, opt.emoji, JSON.stringify(opt.points), optIndex);
    });
  });
};

// Seed default dental procedures
const seedDefaultProcedures = () => {
  const procedures = [
    { key: 'whitening', name: 'Professional Teeth Whitening', description: 'Brighten your smile up to 8 shades with our safe, effective whitening treatments.', timeframe: '1 visit (45 min) or 2 weeks at home', icon: '✨', color_gradient: 'from-yellow-400 to-amber-500', category: 'cosmetic' },
    { key: 'invisalign', name: 'Invisalign Clear Aligners', description: 'Straighten your teeth discreetly with nearly invisible aligners. No metal brackets!', timeframe: '6-18 months typical', icon: '📐', color_gradient: 'from-blue-400 to-cyan-500', category: 'orthodontic' },
    { key: 'veneers', name: 'Porcelain Veneers', description: 'Custom-crafted shells that transform the color, shape, and size of your teeth.', timeframe: '2-3 visits over 2-4 weeks', icon: '💎', color_gradient: 'from-purple-400 to-pink-500', category: 'cosmetic' },
    { key: 'bonding', name: 'Dental Bonding', description: 'Quick, affordable fix for chips, gaps, and minor imperfections.', timeframe: '1 visit (30-60 min per tooth)', icon: '🔧', color_gradient: 'from-green-400 to-emerald-500', category: 'cosmetic' },
    { key: 'preventive', name: 'Preventive Care Plan', description: 'Keep your healthy smile shining with regular cleanings and checkups.', timeframe: 'Every 6 months', icon: '🛡️', color_gradient: 'from-teal-400 to-cyan-500', category: 'preventive' },
    { key: 'deepCleaning', name: 'Deep Cleaning (Scaling)', description: 'Restore gum health with a thorough cleaning below the gumline.', timeframe: '1-2 visits', icon: '🧹', color_gradient: 'from-indigo-400 to-blue-500', category: 'preventive' },
    { key: 'implants', name: 'Dental Implants', description: 'Permanent, natural-looking replacement for missing teeth.', timeframe: '3-6 months total process', icon: '🦷', color_gradient: 'from-slate-400 to-zinc-500', category: 'restorative' },
    { key: 'crowns', name: 'Dental Crowns', description: 'Restore damaged teeth with custom-fitted, natural-looking caps.', timeframe: '2 visits over 2 weeks', icon: '👑', color_gradient: 'from-amber-400 to-orange-500', category: 'restorative' },
    { key: 'gumContouring', name: 'Gum Contouring', description: 'Reshape your gumline for a more balanced, beautiful smile.', timeframe: '1 visit', icon: '✂️', color_gradient: 'from-rose-400 to-pink-500', category: 'cosmetic' },
    { key: 'cosmetic', name: 'Smile Makeover Consultation', description: 'Comprehensive evaluation to design your perfect smile transformation.', timeframe: '1 consultation visit', icon: '🎨', color_gradient: 'from-violet-400 to-purple-500', category: 'cosmetic' },
    { key: 'sedation', name: 'Sedation Dentistry', description: 'Relaxation options for a comfortable, anxiety-free experience.', timeframe: 'Available with any procedure', icon: '😌', color_gradient: 'from-sky-400 to-blue-500', category: 'comfort' },
    { key: 'anxietyFree', name: 'Anxiety-Free Experience', description: "We specialize in making nervous patients feel at ease. You're in caring hands!", timeframe: 'Every visit', icon: '🤗', color_gradient: 'from-pink-400 to-rose-500', category: 'comfort' }
  ];

  const insertProcedure = db.prepare(`
    INSERT INTO dental_procedures (key, name, description, timeframe, icon, color_gradient, category, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  procedures.forEach((p, index) => {
    insertProcedure.run(p.key, p.name, p.description, p.timeframe, p.icon, p.color_gradient, p.category, index);
  });
};

// Initialize tables
initQuizTables();

// ==================== QUESTION CRUD ====================

const getAllQuestions = () => {
  return db.prepare(`
    SELECT * FROM quiz_questions
    WHERE is_active = 1
    ORDER BY sort_order ASC
  `).all();
};

const getQuestionById = (id) => {
  return db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(id);
};

const getQuestionsWithOptions = () => {
  const questions = getAllQuestions();
  return questions.map(q => ({
    ...q,
    options: getOptionsByQuestionId(q.id)
  }));
};

const createQuestion = (data) => {
  const result = db.prepare(`
    INSERT INTO quiz_questions (question, subtitle, category, icon, fun_fact, is_multi_select, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.question, data.subtitle, data.category, data.icon || '⭐', data.fun_fact, data.is_multi_select || 0, data.sort_order || 0);
  return result.lastInsertRowid;
};

const updateQuestion = (id, data) => {
  return db.prepare(`
    UPDATE quiz_questions
    SET question = ?, subtitle = ?, category = ?, icon = ?, fun_fact = ?, is_multi_select = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(data.question, data.subtitle, data.category, data.icon, data.fun_fact, data.is_multi_select, data.sort_order, id);
};

const deleteQuestion = (id) => {
  return db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(id);
};

// ==================== OPTIONS CRUD ====================

const getOptionsByQuestionId = (questionId) => {
  return db.prepare('SELECT * FROM quiz_options WHERE question_id = ? ORDER BY sort_order ASC').all(questionId);
};

const createOption = (data) => {
  return db.prepare(`
    INSERT INTO quiz_options (question_id, label, emoji, points, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.question_id, data.label, data.emoji || '✓', JSON.stringify(data.points || {}), data.sort_order || 0);
};

const updateOption = (id, data) => {
  return db.prepare(`
    UPDATE quiz_options SET label = ?, emoji = ?, points = ?, sort_order = ? WHERE id = ?
  `).run(data.label, data.emoji, JSON.stringify(data.points || {}), data.sort_order, id);
};

const deleteOption = (id) => {
  return db.prepare('DELETE FROM quiz_options WHERE id = ?').run(id);
};

const deleteOptionsByQuestionId = (questionId) => {
  return db.prepare('DELETE FROM quiz_options WHERE question_id = ?').run(questionId);
};

// ==================== SUBMISSIONS ====================

const createSubmission = (data) => {
  const result = db.prepare(`
    INSERT INTO quiz_submissions (first_name, email, phone, smile_type, smile_type_name, recommendations, timeline, primary_interest, source, utm_source, utm_medium, utm_campaign, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.first_name,
    data.email,
    data.phone,
    data.smile_type,
    data.smile_type_name,
    JSON.stringify(data.recommendations || []),
    data.timeline,
    data.primary_interest,
    data.source,
    data.utm_source,
    data.utm_medium,
    data.utm_campaign,
    data.ip_address,
    data.user_agent
  );
  return result.lastInsertRowid;
};

const createAnswer = (data) => {
  return db.prepare(`
    INSERT INTO quiz_answers (submission_id, question_id, selected_options)
    VALUES (?, ?, ?)
  `).run(data.submission_id, data.question_id, JSON.stringify(data.selected_options));
};

const getSubmissions = (limit = 50, offset = 0) => {
  return db.prepare(`
    SELECT * FROM quiz_submissions
    ORDER BY completed_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
};

const getSubmissionById = (id) => {
  return db.prepare('SELECT * FROM quiz_submissions WHERE id = ?').get(id);
};

const getSubmissionAnswers = (submissionId) => {
  return db.prepare(`
    SELECT qa.*, qq.question, qq.category
    FROM quiz_answers qa
    JOIN quiz_questions qq ON qa.question_id = qq.id
    WHERE qa.submission_id = ?
  `).all(submissionId);
};

const countSubmissions = () => {
  return db.prepare('SELECT COUNT(*) as count FROM quiz_submissions').get().count;
};

const markNotificationSent = (id) => {
  return db.prepare('UPDATE quiz_submissions SET notification_sent = 1 WHERE id = ?').run(id);
};

// ==================== PROCEDURES ====================

const getAllProcedures = () => {
  return db.prepare('SELECT * FROM dental_procedures WHERE is_active = 1 ORDER BY sort_order ASC').all();
};

const getProcedureByKey = (key) => {
  return db.prepare('SELECT * FROM dental_procedures WHERE key = ?').get(key);
};

// ==================== ANALYTICS ====================

const getQuizStats = () => {
  const totalSubmissions = countSubmissions();
  const submissionsWithEmail = db.prepare("SELECT COUNT(*) as count FROM quiz_submissions WHERE email IS NOT NULL AND email != ''").get().count;
  const submissionsToday = db.prepare("SELECT COUNT(*) as count FROM quiz_submissions WHERE date(completed_at) = date('now')").get().count;
  const submissionsThisWeek = db.prepare("SELECT COUNT(*) as count FROM quiz_submissions WHERE completed_at >= date('now', '-7 days')").get().count;

  // Top interests
  const topInterests = db.prepare(`
    SELECT primary_interest, COUNT(*) as count
    FROM quiz_submissions
    WHERE primary_interest IS NOT NULL
    GROUP BY primary_interest
    ORDER BY count DESC
    LIMIT 5
  `).all();

  // Timeline breakdown
  const timelineBreakdown = db.prepare(`
    SELECT timeline, COUNT(*) as count
    FROM quiz_submissions
    WHERE timeline IS NOT NULL
    GROUP BY timeline
    ORDER BY count DESC
  `).all();

  // Smile types
  const smileTypes = db.prepare(`
    SELECT smile_type_name, COUNT(*) as count
    FROM quiz_submissions
    WHERE smile_type_name IS NOT NULL
    GROUP BY smile_type_name
    ORDER BY count DESC
  `).all();

  return {
    totalSubmissions,
    submissionsWithEmail,
    submissionsToday,
    submissionsThisWeek,
    conversionRate: totalSubmissions > 0 ? Math.round((submissionsWithEmail / totalSubmissions) * 100) : 0,
    topInterests,
    timelineBreakdown,
    smileTypes
  };
};

module.exports = {
  // Questions
  getAllQuestions,
  getQuestionById,
  getQuestionsWithOptions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  // Options
  getOptionsByQuestionId,
  createOption,
  updateOption,
  deleteOption,
  deleteOptionsByQuestionId,
  // Submissions
  createSubmission,
  createAnswer,
  getSubmissions,
  getSubmissionById,
  getSubmissionAnswers,
  countSubmissions,
  markNotificationSent,
  // Procedures
  getAllProcedures,
  getProcedureByKey,
  // Analytics
  getQuizStats
};
