const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare(`
      SELECT sp.*, o.title as offer_title, o.slug as offer_slug
      FROM social_posts sp
      LEFT JOIN offers o ON sp.offer_id = o.id
      ORDER BY sp.created_at DESC
    `).all();
  },

  getByOffer(offerId) {
    return db.prepare(`
      SELECT * FROM social_posts WHERE offer_id = ? ORDER BY created_at DESC
    `).all(offerId);
  },

  getById(id) {
    return db.prepare('SELECT * FROM social_posts WHERE id = ?').get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO social_posts (
        offer_id, platform, post_type, content, hashtags,
        image_suggestion, link_url, status, scheduled_for
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.offer_id || null,
      data.platform,
      data.post_type || 'promotional',
      data.content,
      data.hashtags || null,
      data.image_suggestion || null,
      data.link_url || null,
      data.status || 'draft',
      data.scheduled_for || null
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE social_posts SET
        offer_id = ?, platform = ?, post_type = ?, content = ?,
        hashtags = ?, image_suggestion = ?, link_url = ?,
        status = ?, scheduled_for = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.offer_id || null,
      data.platform,
      data.post_type || 'promotional',
      data.content,
      data.hashtags || null,
      data.image_suggestion || null,
      data.link_url || null,
      data.status || 'draft',
      data.scheduled_for || null,
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM social_posts WHERE id = ?').run(id);
  },

  markPosted(id) {
    return db.prepare(`
      UPDATE social_posts SET status = 'posted', posted_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  },

  getStats() {
    return db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted
      FROM social_posts
    `).get();
  },

  // Platform-specific character limits
  platformLimits: {
    twitter: 280,
    facebook: 2200,
    instagram: 2200,
    linkedin: 3000
  },

  // Generate posts from BrandScript and Offer
  generatePosts(offer, brandscript, platforms = ['facebook', 'instagram', 'twitter', 'linkedin']) {
    const posts = [];
    const linkUrl = `/offers/${offer.slug}`;

    // Parse brandscript JSON fields if needed
    let bs = brandscript;
    if (typeof bs.success_outcomes === 'string') {
      bs = {
        ...bs,
        success_outcomes: JSON.parse(bs.success_outcomes || '[]'),
        failure_consequences: JSON.parse(bs.failure_consequences || '[]'),
        process_plan_steps: JSON.parse(bs.process_plan_steps || '[]')
      };
    }

    const templates = this.getTemplates(offer, bs, linkUrl);

    platforms.forEach(platform => {
      templates.forEach(template => {
        posts.push({
          platform,
          post_type: template.type,
          content: this.formatForPlatform(template.content, platform),
          hashtags: template.hashtags,
          image_suggestion: template.image_suggestion,
          link_url: linkUrl,
          offer_id: offer.id
        });
      });
    });

    return posts;
  },

  getTemplates(offer, bs, linkUrl) {
    const successOutcome = bs.success_outcomes?.[0] || 'achieve your goals';
    const problem = bs.problem_internal || 'struggling with dental care';
    const ctaText = offer.cta_text || bs.direct_cta_text || 'Learn More';

    return [
      // Problem-focused post
      {
        type: 'problem',
        content: `Tired of ${problem.toLowerCase()}?\n\nYou're not alone. ${bs.guide_empathy_statement || "We understand."}\n\n${offer.headline || offer.title} - ${ctaText}!\n\nLink in bio or visit: ${linkUrl}`,
        hashtags: '#DentalCare #HealthySmile #DentistLife #OralHealth',
        image_suggestion: 'Before/after smile transformation or relatable problem image'
      },
      // Success-focused post
      {
        type: 'success',
        content: `Imagine: ${successOutcome}.\n\nThat's what our patients experience with ${offer.title}.\n\n${offer.subheadline || ''}\n\n${ctaText}: ${linkUrl}`,
        hashtags: '#SmileTransformation #DentalHealth #ConfidentSmile #HealthyTeeth',
        image_suggestion: 'Happy patient smiling or success outcome imagery'
      },
      // Offer/Promo post
      {
        type: 'promotional',
        content: `${offer.headline || offer.title}\n\n${offer.subheadline || offer.description || ''}\n\nDon't miss out - ${ctaText} today!\n\n${linkUrl}`,
        hashtags: '#DentalOffer #SpecialPromo #Dentist #SmileMakeover',
        image_suggestion: 'Eye-catching offer graphic with headline'
      },
      // Story/Educational post
      {
        type: 'educational',
        content: `Did you know? ${bs.problem_philosophical || 'Everyone deserves a healthy smile.'}\n\nThat's why we offer ${offer.title}.\n\nLearn more: ${linkUrl}`,
        hashtags: '#DentalTips #OralHealthTips #DentalEducation #SmileFacts',
        image_suggestion: 'Educational infographic or tip carousel'
      }
    ];
  },

  formatForPlatform(content, platform) {
    const limit = this.platformLimits[platform];

    // Twitter needs to be shorter
    if (platform === 'twitter' && content.length > limit) {
      // Truncate and add ellipsis
      const lines = content.split('\n').filter(l => l.trim());
      let shortened = lines[0];
      if (shortened.length > limit - 30) {
        shortened = shortened.substring(0, limit - 33) + '...';
      }
      // Try to keep the link
      const linkMatch = content.match(/(\/offers\/[\w-]+)/);
      if (linkMatch) {
        shortened += '\n\n' + linkMatch[1];
      }
      return shortened;
    }

    // Instagram - no clickable links in posts, adjust CTA
    if (platform === 'instagram') {
      return content.replace(/visit: \/offers\/[\w-]+/gi, 'Link in bio!')
                    .replace(/: \/offers\/[\w-]+/gi, ' - Link in bio!');
    }

    return content;
  }
};
