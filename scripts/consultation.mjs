import express from 'express';
import nodemailer from 'nodemailer';

const inbox = 'info@shreshtadesigns.com';
const deliveryError = 'We couldn’t send your enquiry. Please try again or contact us on WhatsApp.';
const fieldLimits = {
  name: 600, partner_name: 600, email: 254, phone: 40, wedding_date: 10,
  guest_range: 40, venue: 800, vision: 12000, scope: 80,
};
const guestRanges = new Set([
  'Under 100', '100–499', '500–999', '1,000–1,999', '2,000–2,999', '3,000–4,000', 'Over 4,000',
]);
const ceremonyNames = new Map([
  ['engagement', 'Engagement'], ['sangeet', 'Sangeet'], ['haldi', 'Haldi'],
  ['wedding', 'Wedding'], ['reception', 'Reception'],
]);

function validate(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    return { error: 'The enquiry could not be read. Please try again.' };
  }
  if ((data.website ?? '') !== '') return { error: 'The enquiry could not be accepted.' };

  const fields = {};
  for (const [key, limit] of Object.entries(fieldLimits)) {
    const value = data[key] ?? '';
    if (typeof value !== 'string' || Buffer.byteLength(value) > limit) {
      return { error: 'One of the fields is too long or has an invalid format.' };
    }
    fields[key] = value.trim();
  }

  if (!fields.name || !fields.partner_name) return { error: 'Enter both names.' };
  if (!/^[^\s<>,;:"()@]+@[^\s<>,;:"()@]+\.[^\s<>,;:"()@]+$/.test(fields.email)) {
    return { error: 'Enter a valid email address.' };
  }
  const digits = fields.phone.replace(/\D/g, '');
  if (!/^\+?[0-9 ().-]+$/.test(fields.phone) || digits.length < 7 || digits.length > 15) {
    return { error: 'Enter a contact number with 7–15 digits.' };
  }
  const date = new Date(fields.wedding_date + 'T00:00:00.000Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.wedding_date) ||
      Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== fields.wedding_date) {
    return { error: 'Select a valid wedding date.' };
  }

  let guests = fields.guest_range;
  if (guests === 'custom') {
    const count = Number(data.guest_count);
    if (!Number.isSafeInteger(count) || count < 1) {
      return { error: 'Enter a whole number for the expected guest count.' };
    }
    guests = String(count);
  } else if (!guestRanges.has(guests)) {
    return { error: 'Select a guest range or enter a custom guest count.' };
  }

  const ceremonies = data.ceremonies ?? [];
  if (!Array.isArray(ceremonies) || ceremonies.length > ceremonyNames.size ||
      ceremonies.some(id => !ceremonyNames.has(id))) {
    return { error: 'Select ceremonies from the available options.' };
  }
  return { fields, guests, ceremonies: [...new Set(ceremonies)].map(id => ceremonyNames.get(id)) };
}

export function consultationRouter({
  sender = process.env.SMTP_USER,
  transport = sender && process.env.SMTP_PASSWORD ? nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    requireTLS: true,
    auth: { user: sender, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 6000,
    greetingTimeout: 5000,
    socketTimeout: 9000,
  }) : null,
} = {}) {
  const router = express.Router();
  let windowEnd = 0;
  let requests = 0;
  const addresses = new Map();

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/', (req, res, next) => {
    if (['cross-site', 'same-site'].includes(req.get('Sec-Fetch-Site'))) {
      return res.status(403).json({ error: 'Open the enquiry form on the website and try again.' });
    }
    if (!req.is('application/json')) return res.status(415).json({ error: 'Unsupported enquiry format.' });
    next();
  }, express.json({ limit: 20000, inflate: false }), async (req, res) => {
    const result = validate(req.body);
    if (result.error) return res.status(422).json({ error: result.error });
    if (!transport) return res.status(503).json({ error: deliveryError });

    const now = Date.now();
    if (now >= windowEnd) {
      windowEnd = now + 15 * 60 * 1000;
      requests = 0;
      addresses.clear();
    }
    const attempts = addresses.get(req.ip) ?? 0;
    if (attempts >= 5 || requests >= 60) {
      return res.status(429).set('Retry-After', String(Math.ceil((windowEnd - now) / 1000)))
        .json({ error: 'Too many enquiries were submitted. Please try again later or contact us on WhatsApp.' });
    }
    addresses.set(req.ip, attempts + 1);
    requests++;

    const { fields, guests, ceremonies } = result;
    try {
      const receipt = await transport.sendMail({
        from: { name: 'Shreshta Designs', address: sender },
        to: inbox,
        replyTo: fields.email,
        subject: 'New consultation request',
        text: [
          `Your name: ${fields.name}`, `Partner’s name: ${fields.partner_name}`,
          `Email address: ${fields.email}`, `Contact number: ${fields.phone}`,
          `Wedding date: ${fields.wedding_date}`, `Expected guests: ${guests}`,
          `Ceremonies: ${ceremonies.join(', ') || 'Not provided'}`,
          `Dream venue or destination: ${fields.venue || 'Not provided'}`,
          `Celebration scope: ${fields.scope || 'Not provided'}`, '',
          'Wedding vision:', fields.vision || 'Not provided',
        ].join('\n'),
      });
      if (!receipt.accepted?.length) return res.status(503).json({ error: deliveryError });
      return res.json({ ok: true });
    } catch {
      console.error('Consultation email could not be sent.');
      return res.status(503).json({ error: deliveryError });
    }
  });

  router.all('/', (_req, res) => res.status(405).set('Allow', 'POST')
    .json({ error: 'Submit the consultation form using POST.' }));
  router.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'The enquiry is too long. Shorten your vision notes and try again.' });
    }
    if (err.status === 415) return res.status(415).json({ error: 'Unsupported enquiry format.' });
    return res.status(400).json({ error: 'The enquiry could not be read. Please try again.' });
  });
  return router;
}
