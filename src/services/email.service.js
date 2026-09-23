const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured — fall back to a JSON transport so the app keeps
    // working in dev/test without crashing. Nothing is actually sent.
    transporter = nodemailer.createTransport({ jsonTransport: true });
    transporter.__isNoop = true;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();

  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || 'security-scanner@localhost',
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });

    if (t.__isNoop) {
      console.log(`[email:noop] SMTP not configured, would have sent to ${to}: ${subject}`);
    }

    return { sent: !t.__isNoop, info };
  } catch (err) {
    console.error('sendEmail failed:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendEmail };
