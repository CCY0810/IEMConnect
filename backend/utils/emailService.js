import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async send2FACode(to, code) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("2FA code sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending 2FA code:", error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Welcome email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendAccountVerifiedEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Account verified email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending account verified email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(to, name, resetToken) {
    try {
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Password reset email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordChangedEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Password changed email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending password changed email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendAccountDeletedEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Account deleted email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending account deleted email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendNotificationEmail(to, name, title, message) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Notification email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending notification email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendAdminInviteEmail(to, name, inviteUrl, inviterName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Admin invite email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending admin invite email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendRoleChangeEmail(to, name, newRole, changedByName) {
    try {
      const isPromotion = newRole === "admin";
      const subject = isPromotion 
        ? "IEM Connect - You've Been Promoted to Admin!" 
        : "IEM Connect - Your Role Has Changed";
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Role change email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending role change email:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();

