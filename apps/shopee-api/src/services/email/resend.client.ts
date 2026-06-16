/**
 * Resend mailer module
 *
 * Initializes a Resend client from env vars and provides a typed `sendEmail`
 * helper.  In NODE_ENV=test (or when RESEND_API_KEY is absent) all sends are
 * no-ops so unit tests never make real HTTP calls.
 *
 * Templates
 * ---------
 * `password-reset` — branded HTML for password-reset links.
 * Fallback        — plain-text body passed through as-is for unknown templates.
 */
import { Resend } from 'resend'
import { Logger } from '@utils/logger'
import { EmailJobPayload } from '../../queues/job-payloads'

// ─── Template renderer ────────────────────────────────────────────────────────

function renderPasswordResetHtml(resetUrl: string, subject: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#ee4d2d;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:.5px;">Shopee</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#333333;">Đặt lại mật khẩu</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
                Nhấn nút bên dưới để tiếp tục. Liên kết có hiệu lực trong <strong>1 giờ</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#ee4d2d;color:#ffffff;text-decoration:none;
                              font-size:15px;font-weight:bold;padding:14px 32px;border-radius:4px;">
                      Đặt lại mật khẩu
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#888888;">
                Hoặc sao chép và dán địa chỉ URL này vào trình duyệt:
              </p>
              <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#ee4d2d;">${resetUrl}</a>
              </p>
              <p style="margin:0;font-size:13px;color:#aaaaaa;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
                Tài khoản của bạn vẫn an toàn.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:16px 32px;text-align:center;
                        border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;">
                &copy; ${new Date().getFullYear()} Shopee Clone. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Build email HTML from payload ───────────────────────────────────────────

function buildHtml(payload: EmailJobPayload): string {
  if (payload.template === 'password-reset') {
    const resetUrl =
      typeof payload.data?.resetUrl === 'string' ? payload.data.resetUrl : payload.body
    return renderPasswordResetHtml(resetUrl, payload.subject)
  }
  // Generic fallback — wrap plain text in minimal HTML
  const escaped = payload.body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<pre style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">${escaped}</pre>`
}

// ─── Resend client singleton ──────────────────────────────────────────────────

let _resend: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }
  if (!_resend) {
    _resend = new Resend(apiKey)
  }
  return _resend
}

// ─── Public send helper ───────────────────────────────────────────────────────

export async function sendEmail(payload: EmailJobPayload): Promise<void> {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'Shopee <no-reply@resend.dev>'

  // In test env or when key is missing: log and skip
  if (process.env.NODE_ENV === 'test' || !process.env.RESEND_API_KEY) {
    Logger.apiInfo('[ResendMailer] Email send skipped (no RESEND_API_KEY / test env)', {
      to: payload.to,
      subject: payload.subject,
      template: payload.template,
    })
    return
  }

  const client = getResendClient()
  if (!client) {
    Logger.apiWarn('[ResendMailer] Resend client unavailable — skipping send', {
      to: payload.to,
    })
    return
  }

  const html = buildHtml(payload)

  const { error } = await client.emails.send({
    from: fromEmail,
    to: payload.to,
    subject: payload.subject,
    html,
  })

  if (error) {
    throw new Error(`[ResendMailer] Send failed: ${error.message}`)
  }

  Logger.apiInfo('[ResendMailer] Email sent', { to: payload.to, subject: payload.subject })
}
