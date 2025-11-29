const GoogleReviewsService = require('./googleReviews');
const Settings = require('../models/settings');

/**
 * Simple scheduler for background tasks
 */
class Scheduler {
  constructor() {
    this.tasks = [];
    this.intervals = {};
  }

  /**
   * Start the Google Reviews sync scheduler
   * Runs every 24 hours by default
   */
  startGoogleReviewsSync(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;

    // Clear any existing interval
    if (this.intervals.googleReviews) {
      clearInterval(this.intervals.googleReviews);
    }

    console.log(`📅 Google Reviews sync scheduled every ${intervalHours} hours`);

    // Run the sync task
    const syncTask = async () => {
      try {
        const syncStatus = GoogleReviewsService.getSyncStatus();

        // Only sync if configured
        if (!syncStatus.isConfigured) {
          console.log('⏭️ Google Reviews sync skipped: API not configured');
          return;
        }

        console.log('🔄 Starting scheduled Google Reviews sync...');
        const result = await GoogleReviewsService.importReviews();
        console.log(`✅ Google Reviews synced: ${result.imported} new, ${result.updated} updated, ${result.skipped} skipped`);
      } catch (error) {
        console.error('❌ Google Reviews sync failed:', error.message);
      }
    };

    // Set up the interval
    this.intervals.googleReviews = setInterval(syncTask, intervalMs);

    // Optionally run on startup (after a short delay to let the app initialize)
    setTimeout(() => {
      const settings = Settings.getSettings();
      if (settings.google_auto_sync === 'true') {
        syncTask();
      }
    }, 10000); // 10 second delay on startup
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    Object.keys(this.intervals).forEach(key => {
      clearInterval(this.intervals[key]);
    });
    this.intervals = {};
    console.log('⏹️ All scheduled tasks stopped');
  }
}

module.exports = new Scheduler();
