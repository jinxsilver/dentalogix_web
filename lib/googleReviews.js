const Settings = require('../models/settings');
const Reviews = require('../models/reviews');

/**
 * Google Places API service for fetching reviews
 */
class GoogleReviewsService {
  constructor() {
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  /**
   * Get API credentials from settings
   */
  getCredentials() {
    const settings = Settings.getSettings();
    return {
      apiKey: settings.google_places_api_key,
      placeId: settings.google_place_id
    };
  }

  /**
   * Fetch reviews from Google Places API
   */
  async fetchReviews() {
    const { apiKey, placeId } = this.getCredentials();

    if (!apiKey || !placeId) {
      throw new Error('Google Places API key and Place ID are required. Configure them in Settings.');
    }

    const url = `${this.baseUrl}/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return {
        placeName: data.result.name,
        overallRating: data.result.rating,
        totalReviews: data.result.user_ratings_total,
        reviews: data.result.reviews || []
      };
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
      throw error;
    }
  }

  /**
   * Import reviews from Google into the database
   * @param {Object} options - Import options
   * @param {boolean} options.skipExisting - Skip reviews that already exist (by author name + date)
   * @param {string} options.defaultStatus - Default status for imported reviews ('published' or 'draft')
   */
  async importReviews(options = {}) {
    const { skipExisting = true, defaultStatus = 'published' } = options;

    const googleData = await this.fetchReviews();
    const existingReviews = Reviews.getBySource('google');

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    for (const review of googleData.reviews) {
      // Check if review already exists (match by author name and approximate time)
      const existingReview = existingReviews.find(r =>
        r.reviewer_name === review.author_name &&
        r.rating === review.rating
      );

      if (existingReview) {
        if (skipExisting) {
          skipped++;
          continue;
        } else {
          // Update existing review
          Reviews.update(existingReview.id, {
            reviewer_name: review.author_name,
            reviewer_photo: review.profile_photo_url || null,
            content: review.text,
            rating: review.rating,
            source: 'google',
            source_url: review.author_url || null,
            review_date: new Date(review.time * 1000).toISOString().split('T')[0],
            featured: existingReview.featured, // Preserve featured status
            status: existingReview.status // Preserve status
          });
          updated++;
        }
      } else {
        // Create new review
        Reviews.create({
          reviewer_name: review.author_name,
          reviewer_photo: review.profile_photo_url || null,
          content: review.text,
          rating: review.rating,
          source: 'google',
          source_url: review.author_url || null,
          review_date: new Date(review.time * 1000).toISOString().split('T')[0],
          featured: false,
          status: defaultStatus
        });
        imported++;
      }
    }

    // Update overall Google rating in settings
    Settings.updateSettings({
      google_overall_rating: googleData.overallRating?.toString() || '',
      google_total_reviews: googleData.totalReviews?.toString() || '',
      google_last_sync: new Date().toISOString()
    });

    return {
      placeName: googleData.placeName,
      overallRating: googleData.overallRating,
      totalReviews: googleData.totalReviews,
      imported,
      skipped,
      updated,
      total: googleData.reviews.length
    };
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    const settings = Settings.getSettings();
    return {
      lastSync: settings.google_last_sync || null,
      overallRating: settings.google_overall_rating || null,
      totalReviews: settings.google_total_reviews || null,
      isConfigured: !!(settings.google_places_api_key && settings.google_place_id)
    };
  }
}

module.exports = new GoogleReviewsService();
