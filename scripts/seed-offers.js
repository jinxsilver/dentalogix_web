/**
 * Seed initial promotional offers
 * Run with: node scripts/seed-offers.js
 */

const Offers = require('../models/offers');

const initialOffers = [
  {
    title: 'Free Teeth Whitening',
    slug: 'free-whitening',
    headline: 'Get a Brighter Smile Today!',
    subheadline: 'Limited time offer - Professional whitening at no cost with your first visit',
    description: 'Transform your smile with our professional teeth whitening treatment. This exclusive offer includes a comprehensive consultation and our premium whitening service, normally valued at $499.',
    offer_details: `<ul>
  <li>Professional in-office whitening treatment</li>
  <li>Take-home whitening kit included</li>
  <li>Comprehensive dental exam</li>
  <li>Personalized care instructions</li>
  <li>Follow-up appointment included</li>
</ul>`,
    terms: 'Valid for new patients only. Must complete comprehensive exam and cleaning. Cannot be combined with other offers or insurance benefits. Offer expires 30 days after scheduling.',
    cta_text: 'Claim Your Free Whitening',
    cta_color: '#0077B6',
    form_headline: 'Reserve Your Spot',
    form_fields: 'name,email,phone',
    thank_you_message: 'Thank you! Our team will contact you within 24 hours to schedule your appointment.',
    template: 'bold',
    category: 'cosmetic',
    meta_title: 'Free Professional Teeth Whitening | Limited Time Offer',
    meta_description: 'Get professional teeth whitening at no cost with your first visit. Transform your smile with our premium whitening treatment. Book now - limited availability!',
    meta_keywords: 'free teeth whitening, professional whitening, dental offer, cosmetic dentistry',
    status: 'published'
  },
  {
    title: 'Invisalign Consultation',
    slug: 'invisalign-special',
    headline: 'Straighten Your Smile Invisibly',
    subheadline: 'Free consultation + $500 off your Invisalign treatment',
    description: 'Discover how Invisalign can transform your smile without the hassle of traditional braces. Our certified Invisalign providers will create a custom treatment plan just for you.',
    offer_details: `<ul>
  <li>Free comprehensive Invisalign consultation</li>
  <li>3D digital scan of your teeth</li>
  <li>Custom treatment plan preview</li>
  <li>$500 off your Invisalign treatment</li>
  <li>Flexible financing options available</li>
  <li>Free retainers after treatment</li>
</ul>`,
    terms: 'Discount applies to full Invisalign treatment only. Cannot be combined with insurance benefits or other offers. Subject to clinical eligibility. Financing subject to credit approval.',
    cta_text: 'Get Your Free Consultation',
    cta_color: '#8B5CF6',
    form_headline: 'Start Your Smile Journey',
    form_fields: 'name,email,phone,message',
    thank_you_message: 'Excellent! Our Invisalign coordinator will reach out within 24 hours to schedule your complimentary consultation.',
    template: 'standard',
    category: 'cosmetic',
    meta_title: 'Invisalign Special - Free Consultation + $500 Off',
    meta_description: 'Get straighter teeth with Invisalign. Free consultation and $500 off your treatment. Clear aligners for a confident smile. Schedule today!',
    meta_keywords: 'invisalign, clear aligners, invisible braces, teeth straightening, orthodontics',
    status: 'published'
  },
  {
    title: 'New Patient Special',
    slug: 'new-patient-special',
    headline: 'Welcome to Our Dental Family!',
    subheadline: 'Complete exam, X-rays & cleaning for only $99',
    description: 'We believe everyone deserves access to quality dental care. Start your journey to better oral health with our comprehensive new patient package at an unbeatable price.',
    offer_details: `<ul>
  <li>Comprehensive dental examination</li>
  <li>Full set of digital X-rays</li>
  <li>Professional cleaning (prophy)</li>
  <li>Oral cancer screening</li>
  <li>Personalized treatment plan</li>
  <li>One-on-one consultation with the dentist</li>
</ul>`,
    terms: 'Valid for new patients without dental insurance. Regular value $350+. One offer per patient. Must be scheduled within 30 days. Additional treatment not included.',
    cta_text: 'Book Your $99 Visit',
    cta_color: '#10B981',
    form_headline: 'Schedule Your Visit',
    form_fields: 'name,email,phone',
    thank_you_message: 'Welcome! We\'ll call you shortly to schedule your appointment at a time that works best for you.',
    template: 'standard',
    category: 'new-patient',
    meta_title: 'New Patient Special - Exam, X-rays & Cleaning $99',
    meta_description: 'New patients welcome! Get a comprehensive dental exam, X-rays, and professional cleaning for only $99. Start your journey to a healthier smile today.',
    meta_keywords: 'new patient dental special, affordable dentist, dental exam, dental cleaning, dental x-rays',
    status: 'published'
  }
];

console.log('Seeding promotional offers...');

let created = 0;
let skipped = 0;

initialOffers.forEach(offer => {
  const existing = Offers.getBySlug(offer.slug);
  if (existing) {
    console.log(`  Skipped: ${offer.title} (already exists)`);
    skipped++;
  } else {
    Offers.create(offer);
    console.log(`  Created: ${offer.title}`);
    created++;
  }
});

console.log(`\nDone! Created ${created} offers, skipped ${skipped} existing.`);
console.log('\nYou can view and edit these offers at /admin/marketing/offers');
