import brevo from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    if (this.apiKey) {
      this.apiInstance = new brevo.TransactionalEmailsApi();
      const apiKeySetup = this.apiInstance.authentications['apiKey'];
      apiKeySetup.apiKey = this.apiKey;
    } else {
      console.warn("⚠️  BREVO_API_KEY is missing. Email service will be disabled.");
    }
    
    // Format: "Name <email@domain.com>" or just "email@domain.com"
    // Brevo requires split name and email for the sender object
    const rawFrom = process.env.EMAIL_FROM || "IEM Connect <iemconnect1@gmail.com>";
    const match = rawFrom.match(/(.*)<(.*)>/);
    
    if (match) {
        this.sender = { name: match[1].trim(), email: match[2].trim() };
    } else {
        this.sender = { email: rawFrom, name: "IEM Connect" };
    }
  }

  async sendEmail({ to, subject, html }) {
    if (!this.apiInstance) {
        console.warn(`Emails disabled: Email to ${to} skipped`);
        return { success: true, messageId: "mock-id" };
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = this.sender;
    sendSmtpEmail.to = [{ email: to }];

    try {
        const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Email sent successfully. Message ID:", data.messageId);
        return { success: true, messageId: data.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
  }

  async send2FACode(to, code) {
    return this.sendEmail({
        to,
        subject: "IEM Connect - Your 2FA Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Two-Factor Authentication</h2>
            <p>Hello,</p>
            <p>Your 2FA code for IEM Connect is:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #333;">${code}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendWelcomeEmail(to, name) {
    return this.sendEmail({
        to,
        subject: "Welcome to IEM Connect!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to IEM Connect!</h2>
            <p>Hello ${name},</p>
            <p>Welcome to IEM Connect! Your account has been successfully registered.</p>
            <p>Your account is currently pending admin verification. You'll receive another email once your account has been verified.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendAccountVerifiedEmail(to, name) {
    return this.sendEmail({
        to,
        subject: "Your IEM Connect Account Has Been Verified!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Account Verified!</h2>
            <p>Hello ${name},</p>
            <p>Great news! Your IEM Connect account has been verified by an administrator.</p>
            <p>You can now log in to your account and access all features of IEM Connect.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendPasswordResetEmail(to, name, resetToken) {
    const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/reset-password?token=${resetToken}`;

    return this.sendEmail({
        to,
        subject: "IEM Connect - Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password for your IEM Connect account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendPasswordChangedEmail(to, name) {
    return this.sendEmail({
        to,
        subject: "IEM Connect - Password Changed Successfully",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed Successfully</h2>
            <p>Hello ${name},</p>
            <p>Your password has been changed successfully.</p>
            <p>You can now log in to your IEM Connect account using your new password.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;"><strong>Security Notice:</strong> If you didn't authorize this change, your account may be compromised. Please contact support immediately.</p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendAccountDeletedEmail(to, name) {
    return this.sendEmail({
        to,
        subject: "IEM Connect - Account Deleted",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Account Deleted</h2>
            <p>Hello ${name},</p>
            <p>Your IEM Connect account has been permanently deleted as requested.</p>
            <p>All your personal data, including profile information, event history, and certificates have been removed from our system.</p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #166534;"><strong>What happens next?</strong></p>
              <ul style="color: #166534; margin: 10px 0;">
                <li>You will no longer be able to log in to IEM Connect</li>
                <li>Your data has been permanently deleted</li>
                <li>You can create a new account anytime if you change your mind</li>
              </ul>
            </div>
            <p>If you deleted your account by mistake, please contact support immediately to see if we can help.</p>
            <p>We're sorry to see you go! If you have any feedback about why you deleted your account, we'd love to hear from you.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendNotificationEmail(to, name, title, message) {
    return this.sendEmail({
        to,
        subject: `IEM Connect - ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${title}</h2>
            <p>Hello ${name},</p>
            <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Dashboard</a>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendAdminInviteEmail(to, name, inviteUrl, inviterName) {
    return this.sendEmail({
        to,
        subject: "IEM Connect - You've Been Invited as an Admin!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">🎉 Admin Invitation</h2>
            <p>Hello ${name},</p>
            <p><strong>${inviterName}</strong> has invited you to join IEM Connect as an <strong>Administrator</strong>.</p>
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>What this means:</strong></p>
              <ul style="color: #1e40af; margin: 10px 0;">
                <li>You'll have full admin access to IEM Connect</li>
                <li>Manage events, users, and reports</li>
                <li>Approve new member registrations</li>
              </ul>
            </div>
            <p>Click the button below to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #6366f1; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${inviteUrl}</p>
            <p><strong>This invitation link expires in 7 days.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendRoleChangeEmail(to, name, newRole, changedByName) {
    const isPromotion = newRole === "admin";
    const subject = isPromotion 
      ? "IEM Connect - You've Been Promoted to Admin!" 
      : "IEM Connect - Your Role Has Changed";
      
    return this.sendEmail({
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${isPromotion ? '🎉 Congratulations!' : 'Role Update'}</h2>
            <p>Hello ${name},</p>
            <p>Your role on IEM Connect has been ${isPromotion ? 'upgraded' : 'changed'} by <strong>${changedByName}</strong>.</p>
            <div style="background-color: ${isPromotion ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${isPromotion ? '#22c55e' : '#ef4444'}; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: ${isPromotion ? '#166534' : '#991b1b'};">
                <strong>Your new role:</strong> ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}
              </p>
            </div>
            ${isPromotion ? `
              <p>As an admin, you now have access to:</p>
              <ul>
                <li>User management and verification</li>
                <li>Event creation and management</li>
                <li>Reports and analytics</li>
                <li>System settings</li>
              </ul>
            ` : `
              <p>You will continue to have access to member features including:</p>
              <ul>
                <li>Event registration and attendance</li>
                <li>Your profile and certificates</li>
                <li>Event history</li>
              </ul>
            `}
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendAccountRemovedEmail(to, name, removedByName) {
    return this.sendEmail({
        to,
        subject: "IEM Connect - Account Removed",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Account Removed</h2>
            <p>Hello ${name},</p>
            <p>We're writing to inform you that your IEM Connect account has been removed by an administrator (<strong>${removedByName}</strong>).</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;"><strong>What this means:</strong></p>
              <ul style="color: #991b1b; margin: 10px 0;">
                <li>You will no longer be able to log in to IEM Connect</li>
                <li>Your profile, event history, and related data have been removed</li>
                <li>Any certificates you've earned are no longer accessible</li>
              </ul>
            </div>
            <p>If you believe this was done in error or have any questions, please contact the IEM Connect administrators or support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }

  async sendApplicationRejectedEmail(to, name, reason, rejectedByName) {
    const reasonSection = reason 
      ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Reason provided:</strong></p>
          <p style="margin: 10px 0 0 0; color: #7f1d1d;">${reason}</p>
        </div>
      `
      : '';

    return this.sendEmail({
        to,
        subject: "IEM Connect - Application Status Update",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Application Status Update</h2>
            <p>Hello ${name},</p>
            <p>Thank you for your interest in joining IEM Connect. After careful review by our team, we regret to inform you that your registration application has not been approved at this time.</p>
            ${reasonSection}
            <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #374151;"><strong>What you can do:</strong></p>
              <ul style="color: #374151; margin: 10px 0;">
                <li>Review your application details and ensure all information is accurate</li>
                <li>Contact the IEM Connect administrators for more information</li>
                <li>You may submit a new application with correct information</li>
              </ul>
            </div>
            <p>If you believe this decision was made in error or have any questions, please don't hesitate to reach out to us.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from IEM Connect. Please do not reply to this email.
            </p>
          </div>
        `
    });
  }
}

export default new EmailService();
