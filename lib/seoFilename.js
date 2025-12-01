/**
 * SEO Filename Validator
 * Checks if image filenames are SEO-friendly and provides suggestions
 */

// Common non-descriptive filename patterns
const BAD_PATTERNS = [
  /^img[-_]?\d*/i,                    // img1, img_2, IMG-123
  /^image[-_]?\d*/i,                  // image1, image_2
  /^photo[-_]?\d*/i,                  // photo1, photo_2
  /^picture[-_]?\d*/i,                // picture1
  /^screenshot[-_]?\d*/i,             // screenshot1, Screenshot_2024
  /^screen[-_]?shot/i,                // screen shot
  /^dsc[-_]?\d+/i,                    // DSC_0001 (camera default)
  /^dcim[-_]?\d*/i,                   // DCIM camera folder names
  /^p\d{6,}/i,                        // P1010234 (camera)
  /^sam[-_]?\d+/i,                    // SAM_1234 (Samsung)
  /^img_\d{8}/i,                      // IMG_20240101
  /^\d{8,}/,                          // 20240101_123456
  /^[a-f0-9]{8,}$/i,                  // hex strings (uuid-like)
  /^untitled/i,                       // untitled, Untitled-1
  /^new[-_]?file/i,                   // newfile, new_file
  /^copy[-_]?of/i,                    // copy of, Copy_of
  /^temp/i,                           // temp, temporary
  /^test/i,                           // test, test1
  /^file[-_]?\d*/i,                   // file1, file_2
  /^\d+[-_]?\d*$/,                    // Just numbers: 123, 123_456
  /^[a-z]{1,3}\d{3,}/i,               // ABC1234 patterns
];

// Minimum requirements for a good filename
const MIN_DESCRIPTIVE_WORDS = 2;
const MIN_FILENAME_LENGTH = 8;

/**
 * Check if a filename is SEO-optimized
 * @param {string} filename - The filename to check (with or without extension)
 * @returns {object} { isOptimized: boolean, issues: string[], score: number }
 */
function analyzeFilename(filename) {
  const issues = [];
  let score = 100;

  // Get filename without extension
  const ext = filename.lastIndexOf('.') > 0 ? filename.substring(filename.lastIndexOf('.')) : '';
  const nameOnly = filename.replace(/\.[^.]+$/, '');

  // Check against bad patterns
  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(nameOnly)) {
      issues.push('Generic or auto-generated filename detected');
      score -= 40;
      break;
    }
  }

  // Check length
  if (nameOnly.length < MIN_FILENAME_LENGTH) {
    issues.push('Filename is too short - add more descriptive words');
    score -= 20;
  }

  // Check for descriptive words (split by common separators)
  const words = nameOnly.split(/[-_\s]+/).filter(w => w.length > 2);
  if (words.length < MIN_DESCRIPTIVE_WORDS) {
    issues.push('Use multiple descriptive words separated by hyphens');
    score -= 25;
  }

  // Check for spaces (should use hyphens)
  if (nameOnly.includes(' ')) {
    issues.push('Use hyphens (-) instead of spaces');
    score -= 10;
  }

  // Check for underscores (hyphens preferred for SEO)
  if (nameOnly.includes('_')) {
    issues.push('Consider using hyphens (-) instead of underscores for better SEO');
    score -= 5;
  }

  // Check for uppercase (should be lowercase)
  if (nameOnly !== nameOnly.toLowerCase()) {
    issues.push('Use lowercase letters for consistency');
    score -= 5;
  }

  // Check for special characters
  if (/[^a-z0-9\-_]/i.test(nameOnly)) {
    issues.push('Avoid special characters - use only letters, numbers, and hyphens');
    score -= 15;
  }

  // Bonus: Check if it contains location or business-relevant words
  const goodKeywords = ['dental', 'dentist', 'teeth', 'smile', 'clinic', 'office', 'patient', 'doctor', 'treatment', 'service'];
  const hasGoodKeyword = goodKeywords.some(kw => nameOnly.toLowerCase().includes(kw));
  if (!hasGoodKeyword && score > 50) {
    issues.push('Consider including relevant keywords (e.g., dental, smile, clinic, treatment)');
  }

  return {
    isOptimized: score >= 70 && issues.length <= 1,
    issues,
    score: Math.max(0, score)
  };
}

/**
 * Generate SEO-friendly filename suggestion based on context
 * @param {string} originalFilename - The original filename
 * @param {object} context - Context about where the image is being used
 * @returns {string} Suggested filename
 */
function generateSuggestion(originalFilename, context = {}) {
  const ext = originalFilename.lastIndexOf('.') > 0
    ? originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase()
    : '.jpg';

  const suggestions = [];

  // Build suggestion based on context
  const { fieldType, pageName, serviceName, postTitle, teamMember, businessName = 'dentalogix' } = context;

  if (fieldType) {
    switch (fieldType) {
      case 'hero_image':
        suggestions.push(`${businessName}-hero-banner${ext}`);
        suggestions.push(`dental-office-welcome-hero${ext}`);
        if (pageName) suggestions.push(`${slugify(pageName)}-page-hero${ext}`);
        break;

      case 'featured_image':
        if (postTitle) {
          suggestions.push(`${slugify(postTitle)}${ext}`);
        }
        suggestions.push(`dental-blog-featured-image${ext}`);
        break;

      case 'image':
      case 'service_image':
        if (serviceName) {
          suggestions.push(`${slugify(serviceName)}-dental-service${ext}`);
          suggestions.push(`${businessName}-${slugify(serviceName)}${ext}`);
        }
        suggestions.push(`dental-treatment-procedure${ext}`);
        break;

      case 'photo':
      case 'team_photo':
        if (teamMember) {
          suggestions.push(`dr-${slugify(teamMember)}-dentist-portrait${ext}`);
          suggestions.push(`${slugify(teamMember)}-dental-team${ext}`);
        }
        suggestions.push(`dental-team-member-portrait${ext}`);
        break;

      case 'patient_photo':
        suggestions.push(`patient-smile-testimonial${ext}`);
        suggestions.push(`dental-patient-review${ext}`);
        break;

      case 'site_logo':
        suggestions.push(`${businessName}-dental-logo${ext}`);
        break;

      case 'favicon':
        suggestions.push(`${businessName}-favicon${ext}`);
        break;

      case 'about_image':
      case 'about_image_main':
        suggestions.push(`${businessName}-dental-office${ext}`);
        suggestions.push(`about-our-dental-practice${ext}`);
        break;

      case 'logo':
        suggestions.push(`insurance-provider-logo${ext}`);
        suggestions.push(`dental-insurance-accepted${ext}`);
        break;

      default:
        suggestions.push(`${businessName}-dental-image${ext}`);
    }
  }

  // Generic fallback suggestions
  if (suggestions.length === 0) {
    suggestions.push(`${businessName}-dental-practice${ext}`);
    suggestions.push(`professional-dental-care${ext}`);
  }

  return suggestions;
}

/**
 * Convert text to URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')      // Replace spaces and underscores with hyphens
    .replace(/[^\w\-]+/g, '')     // Remove non-word chars except hyphens
    .replace(/\-\-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-+/, '')           // Remove leading hyphens
    .replace(/-+$/, '');          // Remove trailing hyphens
}

/**
 * Create a user-friendly warning message
 */
function createWarningMessage(filename, analysis, suggestions) {
  const suggestionList = suggestions.slice(0, 3).join('\n    - ');

  return {
    type: 'seo_warning',
    title: 'Image Filename Not SEO-Optimized',
    message: `The uploaded file "${filename}" may not be optimal for search engines.`,
    issues: analysis.issues,
    suggestion: `For better SEO, rename your file before uploading. Examples:\n    - ${suggestionList}`,
    tips: [
      'Use descriptive words that describe the image content',
      'Separate words with hyphens (not underscores or spaces)',
      'Include relevant keywords like "dental", "smile", or service names',
      'Keep filenames lowercase',
      'Avoid generic names like "image1" or "photo"'
    ]
  };
}

module.exports = {
  analyzeFilename,
  generateSuggestion,
  createWarningMessage,
  slugify
};
