const emailShell = ({ title, bodyHtml, ctaText, ctaUrl }) => `
<div style="background:#f5f5f5;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <div style="background:#0A0A0A;padding:24px 32px;">
      <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">VENDORA<span style="color:#FF3E00;">.</span></span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;color:#0A0A0A;font-size:20px;">${title}</h1>
      <div style="color:#3f3f46;font-size:14px;line-height:1.7;">${bodyHtml}</div>
      ${
        ctaUrl
          ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;background:#FF3E00;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 32px;border-radius:12px;">${ctaText}</a>`
          : ''
      }
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:11px;">
      Vendora — multi-vendor marketplace. If you didn't expect this email, you can safely ignore it.
    </div>
  </div>
</div>`;

module.exports = { emailShell };