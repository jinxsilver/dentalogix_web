const nodemailer = require('nodemailer');
const Settings = require('../models/settings');

/**
 * Email Service
 * Sends email notifications using SMTP settings from admin panel
 */

// Create transporter based on current settings
function getTransporter() {
  const settings = Settings.getSettings();

  if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port) || 587,
    secure: settings.smtp_secure === 'true',
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass
    }
  });
}

// Send email notification for new contact form submission
async function sendContactNotification(contact) {
  const settings = Settings.getSettings();
  const transporter = getTransporter();

  if (!transporter) {
    console.log('Email not configured - skipping notification');
    return { success: false, reason: 'not_configured' };
  }

  const notificationEmail = settings.notification_email || settings.email;
  if (!notificationEmail) {
    console.log('No notification email configured');
    return { success: false, reason: 'no_recipient' };
  }

  const siteName = settings.site_name || 'Dentalogix';
  const fromEmail = settings.smtp_from || settings.smtp_user;

  try {
    await transporter.sendMail({
      from: `"${siteName}" <${fromEmail}>`,
      to: notificationEmail,
      subject: `New Contact Form Submission: ${contact.subject || 'General Inquiry'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0077B6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 120px;">Name:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${contact.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                  <a href="mailto:${contact.email}" style="color: #0077B6;">${contact.email}</a>
                </td>
              </tr>
              ${contact.phone ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Phone:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                  <a href="tel:${contact.phone}" style="color: #0077B6;">${contact.phone}</a>
                </td>
              </tr>
              ` : ''}
              ${contact.subject ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Subject:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${contact.subject}</td>
              </tr>
              ` : ''}
            </table>
            <div style="margin-top: 20px;">
              <p style="font-weight: bold; margin-bottom: 10px;">Message:</p>
              <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0;">
                ${contact.message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          <div style="padding: 20px; background: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
            This email was sent from your website contact form.
            <br>
            <a href="${settings.site_url || ''}/admin/contacts" style="color: #0077B6;">View all messages in admin panel</a>
          </div>
        </div>
      `
    });

    console.log('Contact notification email sent to:', notificationEmail);
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact notification:', error);
    return { success: false, reason: 'send_failed', error: error.message };
  }
}

// Send confirmation email to the person who submitted the form
async function sendContactConfirmation(contact) {
  const settings = Settings.getSettings();

  if (settings.send_contact_confirmation !== 'true') {
    return { success: false, reason: 'disabled' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, reason: 'not_configured' };
  }

  const siteName = settings.site_name || 'Dentalogix';
  const fromEmail = settings.smtp_from || settings.smtp_user;
  const phone = settings.phone || '';

  try {
    await transporter.sendMail({
      from: `"${siteName}" <${fromEmail}>`,
      to: contact.email,
      subject: `Thank you for contacting ${siteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0077B6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Thank You for Reaching Out!</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p>Dear ${contact.name},</p>
            <p>Thank you for contacting us. We have received your message and will get back to you as soon as possible.</p>
            <p>Here's a copy of your message:</p>
            <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0; margin: 20px 0;">
              ${contact.message.replace(/\n/g, '<br>')}
            </div>
            <p>If you need immediate assistance, please call us at <strong>${phone}</strong>.</p>
            <p>Best regards,<br>The ${siteName} Team</p>
          </div>
          <div style="padding: 20px; background: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
            ${siteName}
            ${settings.address ? `<br>${settings.address}` : ''}
            ${settings.city ? `<br>${settings.city}` : ''}
          </div>
        </div>
      `
    });

    console.log('Contact confirmation email sent to:', contact.email);
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact confirmation:', error);
    return { success: false, reason: 'send_failed', error: error.message };
  }
}

// Send notification for new lead capture (offers/landing pages)
async function sendLeadNotification(lead, offer) {
  const settings = Settings.getSettings();
  const transporter = getTransporter();

  if (!transporter) {
    return { success: false, reason: 'not_configured' };
  }

  const notificationEmail = settings.notification_email || settings.email;
  if (!notificationEmail) {
    return { success: false, reason: 'no_recipient' };
  }

  const siteName = settings.site_name || 'Dentalogix';
  const fromEmail = settings.smtp_from || settings.smtp_user;

  try {
    await transporter.sendMail({
      from: `"${siteName}" <${fromEmail}>`,
      to: notificationEmail,
      subject: `New Lead: ${offer.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16A34A; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Lead Captured!</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <p style="background: #d1fae5; padding: 10px 15px; border-radius: 5px; color: #166534;">
              <strong>Offer:</strong> ${offer.title}
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 120px;">Name:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${lead.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                  <a href="mailto:${lead.email}" style="color: #0077B6;">${lead.email}</a>
                </td>
              </tr>
              ${lead.phone ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Phone:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                  <a href="tel:${lead.phone}" style="color: #0077B6;">${lead.phone}</a>
                </td>
              </tr>
              ` : ''}
              ${lead.utm_source ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Source:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${lead.utm_source} / ${lead.utm_medium || 'direct'}</td>
              </tr>
              ` : ''}
            </table>
            ${lead.message ? `
            <div style="margin-top: 20px;">
              <p style="font-weight: bold; margin-bottom: 10px;">Message:</p>
              <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0;">
                ${lead.message.replace(/\n/g, '<br>')}
              </div>
            </div>
            ` : ''}
          </div>
          <div style="padding: 20px; background: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
            <a href="${settings.site_url || ''}/admin/marketing/leads" style="color: #0077B6;">View all leads in admin panel</a>
          </div>
        </div>
      `
    });

    console.log('Lead notification email sent to:', notificationEmail);
    return { success: true };
  } catch (error) {
    console.error('Failed to send lead notification:', error);
    return { success: false, reason: 'send_failed', error: error.message };
  }
}

// Send notification for quiz completion
async function sendQuizNotification(data) {
  const settings = Settings.getSettings();
  const transporter = getTransporter();

  if (!transporter) {
    return { success: false, reason: 'not_configured' };
  }

  const notificationEmail = settings.notification_email || settings.email;
  if (!notificationEmail) {
    return { success: false, reason: 'no_recipient' };
  }

  const siteName = settings.site_name || 'Dentalogix';
  const fromEmail = settings.smtp_from || settings.smtp_user;

  // Map timeline values to readable text
  const timelineMap = {
    'asap': 'ASAP - Has an event!',
    'soon': 'Within 3-6 months',
    'year': 'Within a year',
    'flexible': 'No rush'
  };

  // Map interest values to readable text
  const interestMap = {
    'whiter': 'Brighter, whiter smile',
    'straighter': 'Straighter teeth',
    'healthier': 'Healthier gums & teeth',
    'complete': 'Replace missing teeth',
    'confident': 'Feel more confident'
  };

  const timelineText = timelineMap[data.timeline] || data.timeline || 'Not specified';
  const interestText = interestMap[data.primaryInterest] || data.primaryInterest || 'Not specified';

  try {
    await transporter.sendMail({
      from: `"${siteName}" <${fromEmail}>`,
      to: notificationEmail,
      subject: `New Quiz Lead: ${data.firstName || 'Anonymous'} - ${data.smileType || 'Smile Assessment'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6, #06b6d4); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Smile Assessment Completed!</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <strong style="color: #166534;">Smile Type:</strong> ${data.smileType || 'Not determined'}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold; width: 140px;">Name:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${data.firstName || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Email:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                  ${data.email && data.email !== 'Not provided' ? `<a href="mailto:${data.email}" style="color: #0077B6;">${data.email}</a>` : 'Not provided'}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Phone:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                  ${data.phone && data.phone !== 'Not provided' ? `<a href="tel:${data.phone}" style="color: #0077B6;">${data.phone}</a>` : 'Not provided'}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Primary Interest:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">${interestText}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Timeline:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                  <span style="background: ${data.timeline === 'asap' ? '#fef3c7' : '#e0f2fe'}; padding: 2px 8px; border-radius: 4px; font-size: 13px;">
                    ${timelineText}
                  </span>
                </td>
              </tr>
            </table>
            ${data.recommendations && data.recommendations.length > 0 ? `
            <div style="margin-top: 20px;">
              <p style="font-weight: bold; margin-bottom: 10px;">Recommended Treatments:</p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${data.recommendations.map(r => `<span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 13px;">${r}</span>`).join('')}
              </div>
            </div>
            ` : ''}
          </div>
          <div style="padding: 20px; background: #e9ecef; text-align: center; font-size: 12px; color: #6c757d;">
            <a href="${settings.site_url || ''}/admin/quiz" style="color: #0077B6;">View all quiz submissions in admin panel</a>
          </div>
        </div>
      `
    });

    console.log('Quiz notification email sent to:', notificationEmail);
    return { success: true };
  } catch (error) {
    console.error('Failed to send quiz notification:', error);
    return { success: false, reason: 'send_failed', error: error.message };
  }
}

// Test email configuration
async function testEmailConfig() {
  const settings = Settings.getSettings();
  const transporter = getTransporter();

  if (!transporter) {
    return { success: false, error: 'Email not configured. Please fill in SMTP settings.' };
  }

  const notificationEmail = settings.notification_email || settings.email;
  if (!notificationEmail) {
    return { success: false, error: 'No notification email address configured.' };
  }

  try {
    await transporter.verify();

    const fromEmail = settings.smtp_from || settings.smtp_user;
    await transporter.sendMail({
      from: `"${settings.site_name || 'Dentalogix'}" <${fromEmail}>`,
      to: notificationEmail,
      subject: 'Test Email - Configuration Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16A34A;">Email Configuration Successful!</h2>
          <p>Your email settings are working correctly. You will receive notifications when:</p>
          <ul>
            <li>Someone submits a contact form</li>
            <li>A new lead is captured from an offer page</li>
          </ul>
          <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">
            This is a test email from your ${settings.site_name || 'Dentalogix'} website.
          </p>
        </div>
      `
    });

    return { success: true, message: `Test email sent to ${notificationEmail}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendContactNotification,
  sendContactConfirmation,
  sendLeadNotification,
  sendQuizNotification,
  testEmailConfig
};
