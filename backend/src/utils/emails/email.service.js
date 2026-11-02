const nodemailer = require('nodemailer');
const { env, isDev, isProd } = require('../../config/env');
const { logger } = require('../logger');

let transporterPromise = null;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASS) {
        return nodemailer.createTransport({
          host: env.EMAIL_HOST,
          port: env.EMAIL_PORT,
          secure: env.EMAIL_PORT === 465,
          auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
        });
      }
      if (isDev) {
        // Ethereal: catches mail, gives preview URLs — real delivery in dev is never needed.
        const testAccount = await nodemailer.createTestAccount();
        logger.info(`📧 Ethereal test inbox: https://ethereal.email/login (${testAccount.user} / ${testAccount.pass})`);
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      }
      return null; // prod without SMTP config → logged no-op below (never crashes the request)
    })();
  }
  return transporterPromise;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      logger.error({ to }, 'EMAIL_* not configured in production — email skipped');
      return;
    }
    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME || 'Vendora'}" <${env.EMAIL_FROM || env.EMAIL_USER || 'no-reply@vendora.local'}>`,
      to,
      subject,
      html,
    });
    logger.info({ to, messageId: info.messageId }, 'Email sent');
    if (isDev && info.previewURL) logger.info(`📧 Preview: ${info.previewURL}`);
  } catch (err) {
    // Swallow + log: email failures are observability events, not user-facing errors (FR-EML-01).
    logger.error({ err, to, subject }, 'Email failed (fire-and-forget)');
  }
};

module.exports = { sendEmail };