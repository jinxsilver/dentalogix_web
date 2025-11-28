const db = require('./db');

module.exports = {
  getAll() {
    return db.prepare('SELECT * FROM brandscripts ORDER BY created_at DESC').all();
  },

  getActive() {
    return db.prepare('SELECT * FROM brandscripts WHERE is_active = 1 ORDER BY created_at DESC').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM brandscripts WHERE id = ?').get(id);
  },

  getDefault() {
    // Get the active brandscript or first one
    return db.prepare('SELECT * FROM brandscripts WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1').get();
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO brandscripts (
        brand_name, is_active,
        character_name, character_desire, character_identity_from, character_identity_to,
        villain_name, villain_description,
        problem_external, problem_internal, problem_philosophical,
        guide_empathy_statement, guide_authority_stats, guide_testimonials, guide_awards, guide_logos,
        process_plan_name, process_plan_steps, agreement_plan_name, agreement_plan_items,
        direct_cta_text, direct_cta_url, transitional_ctas,
        failure_consequences, success_outcomes,
        transformation_from, transformation_to,
        one_liner
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.brand_name,
      data.is_active ? 1 : 0,
      data.character_name || null,
      data.character_desire || null,
      data.character_identity_from || null,
      data.character_identity_to || null,
      data.villain_name || null,
      data.villain_description || null,
      data.problem_external || null,
      data.problem_internal || null,
      data.problem_philosophical || null,
      data.guide_empathy_statement || null,
      JSON.stringify(data.guide_authority_stats || []),
      JSON.stringify(data.guide_testimonials || []),
      JSON.stringify(data.guide_awards || []),
      JSON.stringify(data.guide_logos || []),
      data.process_plan_name || null,
      JSON.stringify(data.process_plan_steps || []),
      data.agreement_plan_name || null,
      JSON.stringify(data.agreement_plan_items || []),
      data.direct_cta_text || 'Schedule Your Visit',
      data.direct_cta_url || '/contact',
      JSON.stringify(data.transitional_ctas || []),
      JSON.stringify(data.failure_consequences || []),
      JSON.stringify(data.success_outcomes || []),
      data.transformation_from || null,
      data.transformation_to || null,
      data.one_liner || null
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
    const stmt = db.prepare(`
      UPDATE brandscripts SET
        brand_name = ?, is_active = ?,
        character_name = ?, character_desire = ?, character_identity_from = ?, character_identity_to = ?,
        villain_name = ?, villain_description = ?,
        problem_external = ?, problem_internal = ?, problem_philosophical = ?,
        guide_empathy_statement = ?, guide_authority_stats = ?, guide_testimonials = ?, guide_awards = ?, guide_logos = ?,
        process_plan_name = ?, process_plan_steps = ?, agreement_plan_name = ?, agreement_plan_items = ?,
        direct_cta_text = ?, direct_cta_url = ?, transitional_ctas = ?,
        failure_consequences = ?, success_outcomes = ?,
        transformation_from = ?, transformation_to = ?,
        one_liner = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      data.brand_name,
      data.is_active ? 1 : 0,
      data.character_name || null,
      data.character_desire || null,
      data.character_identity_from || null,
      data.character_identity_to || null,
      data.villain_name || null,
      data.villain_description || null,
      data.problem_external || null,
      data.problem_internal || null,
      data.problem_philosophical || null,
      data.guide_empathy_statement || null,
      JSON.stringify(data.guide_authority_stats || []),
      JSON.stringify(data.guide_testimonials || []),
      JSON.stringify(data.guide_awards || []),
      JSON.stringify(data.guide_logos || []),
      data.process_plan_name || null,
      JSON.stringify(data.process_plan_steps || []),
      data.agreement_plan_name || null,
      JSON.stringify(data.agreement_plan_items || []),
      data.direct_cta_text || 'Schedule Your Visit',
      data.direct_cta_url || '/contact',
      JSON.stringify(data.transitional_ctas || []),
      JSON.stringify(data.failure_consequences || []),
      JSON.stringify(data.success_outcomes || []),
      data.transformation_from || null,
      data.transformation_to || null,
      data.one_liner || null,
      id
    );
  },

  delete(id) {
    return db.prepare('DELETE FROM brandscripts WHERE id = ?').run(id);
  },

  setActive(id) {
    // Deactivate all others first
    db.prepare('UPDATE brandscripts SET is_active = 0').run();
    // Activate this one
    return db.prepare('UPDATE brandscripts SET is_active = 1 WHERE id = ?').run(id);
  },

  // Parse JSON fields when retrieving
  parseJsonFields(brandscript) {
    if (!brandscript) return null;
    return {
      ...brandscript,
      guide_authority_stats: JSON.parse(brandscript.guide_authority_stats || '[]'),
      guide_testimonials: JSON.parse(brandscript.guide_testimonials || '[]'),
      guide_awards: JSON.parse(brandscript.guide_awards || '[]'),
      guide_logos: JSON.parse(brandscript.guide_logos || '[]'),
      process_plan_steps: JSON.parse(brandscript.process_plan_steps || '[]'),
      agreement_plan_items: JSON.parse(brandscript.agreement_plan_items || '[]'),
      transitional_ctas: JSON.parse(brandscript.transitional_ctas || '[]'),
      failure_consequences: JSON.parse(brandscript.failure_consequences || '[]'),
      success_outcomes: JSON.parse(brandscript.success_outcomes || '[]')
    };
  },

  // Generate content helpers for landing pages
  generateHeroContent(brandscript) {
    const bs = this.parseJsonFields(brandscript);
    return {
      headline: bs.success_outcomes[0] || bs.character_desire || 'Transform Your Smile',
      subheadline: bs.one_liner || bs.guide_empathy_statement || '',
      cta_text: bs.direct_cta_text,
      cta_url: bs.direct_cta_url
    };
  },

  generateStakesContent(brandscript) {
    const bs = this.parseJsonFields(brandscript);
    return {
      headline: `Don't Let ${bs.villain_name || 'Fear'} Hold You Back`,
      subheadline: bs.problem_internal || '',
      consequences: bs.failure_consequences || []
    };
  },

  generateGuideContent(brandscript) {
    const bs = this.parseJsonFields(brandscript);
    return {
      headline: 'We Get It',
      empathy: bs.guide_empathy_statement || '',
      stats: bs.guide_authority_stats || [],
      testimonials: bs.guide_testimonials || [],
      awards: bs.guide_awards || [],
      logos: bs.guide_logos || []
    };
  },

  generatePlanContent(brandscript) {
    const bs = this.parseJsonFields(brandscript);
    return {
      plan_name: bs.process_plan_name || 'How It Works',
      steps: bs.process_plan_steps || [],
      agreement_name: bs.agreement_plan_name || 'Our Promise',
      agreements: bs.agreement_plan_items || [],
      cta_text: bs.direct_cta_text,
      cta_url: bs.direct_cta_url
    };
  },

  generateSuccessContent(brandscript) {
    const bs = this.parseJsonFields(brandscript);
    return {
      headline: 'Imagine...',
      outcomes: bs.success_outcomes || [],
      transformation_from: bs.transformation_from || '',
      transformation_to: bs.transformation_to || ''
    };
  },

  // Generate one-liner from brandscript data
  generateOneLiner(brandscript) {
    const bs = this.parseJsonFields(brandscript);
    const character = bs.character_name || 'people';
    const problem = bs.problem_internal || 'struggle with finding the right solution';
    const plan = bs.process_plan_name || 'our approach';
    const success = bs.success_outcomes[0] || 'achieve their goals';

    return `Most ${character} ${problem.toLowerCase()}, so we created ${plan.toLowerCase()} — so you can ${success.toLowerCase()}.`;
  }
};
