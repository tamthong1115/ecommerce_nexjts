export function renderOtpEmail(otp: string): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Verify your email</title>
        <style>
          body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #111827; padding: 24px; }
          .code { font-size: 18px; font-weight: 700; background: #f3f4f6; padding: 8px; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <h1>Verify your email or sign in</h1>
        <p>Your verification code:</p>
        <div class="code">${otp}</div>
        <p>If you didn't request this, you can ignore this email.</p>
      </body>
    </html>
  `.trim();
}

export function renderPasswordResetEmail(
  resetLink: string,
  userName?: string
): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Reset Your Password</title>
        <style>
          body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #111827; padding: 24px; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .content { padding: 32px 24px; }
          .button { display: inline-block; background: #7c3aed; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; }
          .button:hover { background: #6d28d9; }
          .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 24px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔐</div>
            <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">We received a request to reset your password</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; line-height: 24px; margin-bottom: 16px;">
              ${userName ? `Hello ${userName},` : 'Hello,'}
            </p>
            <p style="font-size: 16px; line-height: 24px;">
              We received a request to reset the password for your account. Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 4px; color: #6b7280;">
              ${resetLink}
            </p>

            <div class="warning-box">
              <p style="margin: 0; font-weight: 600; color: #92400e; font-size: 14px;">
                ⚠️ Important Security Information
              </p>
              <ul style="margin: 8px 0 0 0; paddingS-left: 20px; color: #78350f; font-size: 13px; line-height: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>For security reasons, this link can only be used once</li>
                <li>If you didn't request this reset, please ignore this email</li>
              </ul>
            </div>
            
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated email, please do not reply.</p>
            <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `.trim();
}

export function renderShopInviteTemplate(
  shopName: string,
  inviterName: string,
  invitationLink: string
): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Shop Invitation</title>
        <style>
          body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #111827; padding: 24px; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .content { padding: 32px 24px; }
          .shop-info { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #7c3aed; }
          .button { display: inline-block; background: #7c3aed; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 24px 0; }
          .button:hover { background: #6d28d9; }
          .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .icon { font-size: 48px; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🏪</div>
            <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Join as a staff member</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; line-height: 24px; margin-bottom: 16px;">
              Hello,
            </p>
            <p style="font-size: 16px; line-height: 24px;">
              <strong>${inviterName}</strong> has invited you to join their shop as a staff member.
            </p>
            
            <div class="shop-info">
              <p style="margin: 0; font-weight: 600; color: #7c3aed; font-size: 18px;">
                ${shopName}
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                Role: Staff Member
              </p>
            </div>

            <p style="font-size: 16px; line-height: 24px; margin-top: 24px;">
              As a staff member, you'll be able to:
            </p>
            <ul style="line-height: 28px; color: #4b5563; margin: 12px 0;">
              <li>Manage products and inventory</li>
              <li>Process and fulfill orders</li>
              <li>Respond to customer inquiries</li>
              <li>View shop analytics and reports</li>
            </ul>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${invitationLink}" class="button">Accept Invitation</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; word-break: break-all; background: #f9fafb; padding: 12px; border-radius: 4px; color: #6b7280;">
              ${invitationLink}
            </p>

            <p style="margin-top: 24px; color: #ef4444; font-size: 14px; font-weight: 500;">
              ⚠️ This invitation will expire in 3 days.
            </p>
            
            <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">
              If you didn't expect this invitation or don't want to join, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated email, please do not reply.</p>
            <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `.trim();
}

export function renderShopStatusChangeEmail(
  shopName: string,
  ownerName: string,
  newStatus: string
): string {
  const statusColors: Record<string, string> = {
    ACTIVE: '#10b981',
    INACTIVE: '#6b7280',
    PENDING: '#f59e0b',
    REJECTED: '#ef4444',
  };

  const statusColor = statusColors[newStatus] || '#7c3aed';

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Shop Status Update</title>
        <style>
          body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #111827; padding: 24px; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .content { padding: 32px 24px; }
          .status-badge { display: inline-block; background: ${statusColor}; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
          .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .icon { font-size: 48px; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🏪</div>
            <h1 style="margin: 0; font-size: 28px;">Shop Status Updated</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; line-height: 24px;">
              Hello ${ownerName},
            </p>
            <p style="font-size: 16px; line-height: 24px;">
              The status of your shop <strong>${shopName}</strong> has been updated.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <div class="status-badge">${newStatus}</div>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
              If you have any questions, please contact support.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated email, please do not reply.</p>
            <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `.trim();
}
