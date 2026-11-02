const { emailShell } = require('./emailShell.template');

const resetPasswordEmail = (user, resetUrl) =>
  emailShell({
    title: `Reset your password, ${user.name}`,
    bodyHtml: `
      <p>We received a request to reset your Vendora password.</p>
      <p>This link is valid for <b>10 minutes</b> and can be used once.
      After resetting, all other sessions will be signed out for your security.</p>
      <p style="color:#71717a;">If the button doesn't work, paste this link into your browser:<br>
      <span style="word-break:break-all;">${resetUrl}</span></p>`,
    ctaText: 'Reset password',
    ctaUrl: resetUrl,
  });

module.exports = { resetPasswordEmail };