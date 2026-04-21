// ── Safe nodemailer import ─────────────────────────────────────────────────
// If nodemailer is not installed yet, emails are skipped gracefully
// so announcements still work. Run: npm install  to enable emails.
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('⚠️  nodemailer not installed — run: npm install   Emails will be skipped.');
}

// ── Helpers ────────────────────────────────────────────────────────────────
const PRIORITY_COLOR = { high: '#ff4d6d', medium: '#ffbe0b', low: '#06d6a0' };
const PRIORITY_LABEL = { high: '🔴 HIGH',  medium: '🟡 MEDIUM', low: '🟢 LOW' };
const AUDIENCE_LABEL = { all: '🌐 Everyone', students: '🎓 Students', staff: '👨‍🏫 Staff' };

function buildHtml(announcement, postedByName) {
  const pColor  = PRIORITY_COLOR[announcement.priority] || '#6c63ff';
  const pLabel  = PRIORITY_LABEL[announcement.priority] || announcement.priority;
  const aLabel  = AUDIENCE_LABEL[announcement.targetAudience] || announcement.targetAudience;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${announcement.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
       style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:#0d1b2a;padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <span style="font-size:26px;">&#127891;</span>
        <span style="color:#fff;font-size:20px;font-weight:700;margin-left:10px;vertical-align:middle;">AcademX</span><br/>
        <span style="color:#9090a8;font-size:12px;margin-left:38px;">Smart Digital Academic Experience Platform</span>
      </td>
      <td align="right">
        <span style="background:${pColor};color:#fff;font-size:11px;font-weight:700;
                     padding:4px 12px;border-radius:20px;">${pLabel}</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Accent stripe -->
  <tr><td style="background:#6c63ff;height:3px;"></td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 32px 24px;">
    <p style="margin:0 0 6px;color:#9090a8;font-size:12px;text-transform:uppercase;
               letter-spacing:1px;font-weight:600;">NEW ANNOUNCEMENT</p>
    <h1 style="margin:0 0 20px;color:#0d1b2a;font-size:22px;font-weight:700;
                line-height:1.3;">${announcement.title}</h1>
    <div style="background:#f8f9fc;border-left:4px solid #6c63ff;
                border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#333;font-size:15px;line-height:1.7;">
        ${String(announcement.content || '').replace(/\n/g, '<br/>')}
      </p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>
      <td style="padding-right:8px;">
        <span style="background:#eef0ff;color:#6c63ff;font-size:12px;font-weight:600;
                     padding:5px 12px;border-radius:20px;">${aLabel}</span>
      </td>
      <td>
        <span style="background:#f0f0f0;color:#555;font-size:12px;
                     padding:5px 12px;border-radius:20px;">&#128197; ${dateStr}</span>
      </td>
    </tr></table>
    <hr style="border:none;border-top:1px solid #eee;margin:0 0 20px;"/>
    <p style="margin:0;color:#9090a8;font-size:13px;">
      Posted by <strong style="color:#444;">${postedByName || 'AcademX Admin'}</strong> via AcademX Portal
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8f9fc;padding:16px 32px;border-top:1px solid #eee;">
    <p style="margin:0;color:#aaa;font-size:11px;text-align:center;">
      You received this because you are a registered AcademX user.<br/>
      Please log in to the portal to view full details.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;
}

// ── Main function ──────────────────────────────────────────────────────────
/**
 * Send announcement email to all targeted recipients.
 * This function NEVER throws — all errors are caught internally.
 * This means announcement creation always succeeds even if email fails.
 */
async function sendAnnouncementEmails(announcement, postedByName, recipients) {
  try {
    // Guard: nodemailer not installed
    if (!nodemailer) {
      console.warn('⚠️  nodemailer not installed — skipping emails. Run: npm install');
      return { sent: 0, failed: 0 };
    }

    // Guard: email not configured in .env
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.warn('⚠️  MAIL_USER / MAIL_PASS not set in .env — skipping emails');
      return { sent: 0, failed: 0 };
    }

    // Guard: no recipients
    if (!recipients || recipients.length === 0) {
      console.log('ℹ️  No recipients found for this announcement — skipping emails');
      return { sent: 0, failed: 0 };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const html    = buildHtml(announcement, postedByName);
    const subject = `[AcademX] ${announcement.title}`;
    const BATCH   = 10;
    let sent = 0, failed = 0;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const emails = recipients
        .slice(i, i + BATCH)
        .map(u => u.email)
        .filter(e => e && typeof e === 'string' && e.includes('@'));

      if (!emails.length) continue;

      try {
        await transporter.sendMail({
          from:    `"AcademX Platform" <${process.env.MAIL_USER}>`,
          bcc:     emails,
          subject,
          html,
          text: `${announcement.title}\n\n${announcement.content}\n\nPosted by: ${postedByName}`,
        });
        sent += emails.length;
        console.log(`📧 Announcement email sent to ${emails.length} recipient(s)`);
      } catch (batchErr) {
        failed += emails.length;
        console.error(`❌ Email batch failed:`, batchErr.message);
      }
    }

    console.log(`📊 Email result — sent: ${sent}, failed: ${failed}`);
    return { sent, failed };

  } catch (err) {
    // Catch-all: NEVER let email errors bubble up and break announcement creation
    console.error('❌ sendAnnouncementEmails unexpected error:', err.message);
    return { sent: 0, failed: 0 };
  }
}

module.exports = { sendAnnouncementEmails };