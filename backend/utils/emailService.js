import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
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
        subject: 'IEM Connect - Your 2FA Code',
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
      console.log('2FA code sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Welcome to IEM Connect!',
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
      console.log('Welcome email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAccountVerifiedEmail(to, name) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Your IEM Connect Account Has Been Verified!',
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
      console.log('Account verified email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending account verified email:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();