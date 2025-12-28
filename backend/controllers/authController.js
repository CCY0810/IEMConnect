import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Joi from "joi";
import crypto from "crypto";
import { Op } from "sequelize";
import User from "../models/User.js";
import {
  generateTwoFACode,
  hashTwoFACode,
  verifyTwoFACode,
  isTwoFACodeExpired,
} from "../utils/twofa.js";
import emailService from "../utils/emailService.js";
import NotificationService from "../services/notificationService.js";
import {
  deleteAvatarFile,
} from "../middleware/profileUpload.js";
import { blacklistToken, blacklistAllUserTokens } from "../services/tokenBlacklistService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      membership_number: Joi.string().length(6).required(),
      matric_number: Joi.string().length(9).required(),
      faculty: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUser = await User.findOne({ where: { email: value.email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Check if matric number already exists
    const existingMatric = await User.findOne({
      where: { matric_number: value.matric_number },
    });
    if (existingMatric) {
      return res
        .status(400)
        .json({ error: "Matric number already registered" });
    }

    const passwordHash = await bcrypt.hash(value.password, 10);

    const user = await User.create({
      name: value.name,
      email: value.email,
      password_hash: passwordHash,
      membership_number: value.membership_number,
      matric_number: value.matric_number,
      faculty: value.faculty,
      is_verified: 0,
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name);

    res.status(201).json({
      message:
        "Registration successful. Your account is pending admin verification.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findOne({ where: { email: value.email } });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: "No account found with this email address" });
    }

    // Check if user is verified
    if (user.is_verified !== 1) {
      return res.status(401).json({ error: "Account pending verification. Please contact an administrator." });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      value.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Generate 2FA code
    const twoFACode = generateTwoFACode();
    const twoFACodeHash = await hashTwoFACode(twoFACode);
    const twoFACodeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await user.update({
      two_fa_code_hash: twoFACodeHash,
      two_fa_code_expiry: twoFACodeExpiry,
    });

    // Send 2FA code via email
    const emailResult = await emailService.send2FACode(user.email, twoFACode);
    if (!emailResult.success) {
      console.error("Failed to send 2FA code:", emailResult.error);
      return res.status(500).json({ error: "Failed to send 2FA code" });
    }

    // Generate temporary token
    const tempToken = jwt.sign(
      { id: user.id, state: "2FA_PENDING" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    res.status(200).json({
      tempToken,
      message: "2FA code sent to your email",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const schema = Joi.object({
      code: Joi.string().length(6).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.user.id);

    if (!user || !user.two_fa_code_hash || !user.two_fa_code_expiry) {
      return res.status(401).json({ error: "No 2FA code found" });
    }

    if (isTwoFACodeExpired(user.two_fa_code_expiry)) {
      return res.status(401).json({ error: "Invalid or expired 2FA code" });
    }

    const isCodeValid = await verifyTwoFACode(
      value.code,
      user.two_fa_code_hash
    );
    if (!isCodeValid) {
      return res.status(401).json({ error: "Invalid or expired 2FA code" });
    }

    // Clear 2FA data
    await user.update({
      two_fa_code_hash: null,
      two_fa_code_expiry: null,
    });

    // Generate final tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership_number: user.membership_number,
        matric_number: user.matric_number,
        faculty: user.faculty,
        bio: user.bio,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    res.status(500).json({ error: "2FA verification failed" });
  }
};

export const logout = async (req, res) => {
  try {
    // Get token from authorization header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (token) {
      // Add token to blacklist - it will be rejected on future requests
      blacklistToken(token, req.user.id);
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * Logout from all sessions
 * Invalidates all tokens for the current user
 */
export const logoutAllSessions = async (req, res) => {
  try {
    // Blacklist all tokens for this user
    // Any token issued before this timestamp will be rejected
    blacklistAllUserTokens(req.user.id);

    res.status(200).json({ message: "All sessions logged out successfully" });
  } catch (error) {
    console.error("Logout all sessions error:", error);
    res.status(500).json({ error: "Failed to logout all sessions" });
  }
};

export const verifySession = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "membership_number",
        "matric_number",
        "faculty",
        "bio",
        "avatar_url",
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership_number: user.membership_number,
        matric_number: user.matric_number,
        faculty: user.faculty,
        bio: user.bio,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Session verification error:", error);
    res.status(500).json({ error: "Session verification failed" });
  }
};

export const resend2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.two_fa_code_hash || !user.two_fa_code_expiry) {
      return res.status(400).json({ error: "No 2FA code found" });
    }

    // Check if 2FA code is still valid
    if (isTwoFACodeExpired(user.two_fa_code_expiry)) {
      return res
        .status(400)
        .json({ error: "2FA code has expired. Please login again." });
    }

    // Generate a new 2FA code
    const twoFACode = generateTwoFACode();
    const twoFACodeHash = await hashTwoFACode(twoFACode);
    const twoFACodeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await user.update({
      two_fa_code_hash: twoFACodeHash,
      two_fa_code_expiry: twoFACodeExpiry,
    });

    // Send new 2FA code via email
    const emailResult = await emailService.send2FACode(user.email, twoFACode);
    if (!emailResult.success) {
      console.error("Failed to send 2FA code:", emailResult.error);
      return res.status(500).json({ error: "Failed to send 2FA code" });
    }

    res.status(200).json({ message: "New 2FA code sent to your email" });
  } catch (error) {
    console.error("Resend 2FA error:", error);
    res.status(500).json({ error: "Failed to resend 2FA code" });
  }
};

// New function to get unverified users (for admin approval)
export const getUnverifiedUsers = async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findByPk(req.user.id);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Get all unverified users (where is_verified = 0)
    const unverifiedUsers = await User.findAll({
      where: { is_verified: 0 }, // Changed from false to 0
      attributes: ["id", "name", "email", "membership_number", "createdAt"],
    });

    res.status(200).json({ users: unverifiedUsers });
  } catch (error) {
    console.error("Get unverified users error:", error);
    res.status(500).json({ error: "Failed to fetch unverified users" });
  }
};

// New function to verify a user (for admin approval)
export const verifyUser = async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findByPk(req.user.id);
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Get user ID from request body
    const { userId } = req.body;

    // Find the user to verify
    const userToVerify = await User.findByPk(userId);
    if (!userToVerify) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user's verification status (set is_verified = 1)
    await userToVerify.update({ is_verified: 1 }); // Changed from true to 1

    // Send verification email
    await emailService.sendAccountVerifiedEmail(
      userToVerify.email,
      userToVerify.name
    );

    res.status(200).json({
      message: `User ${userToVerify.name} has been successfully verified.`,
      user: {
        id: userToVerify.id,
        name: userToVerify.name,
        email: userToVerify.email,
        membership_number: userToVerify.membership_number,
        is_verified: 1, // Changed from true to 1
      },
    });
  } catch (error) {
    console.error("User verification error:", error);
    res.status(500).json({ error: "Failed to verify user" });
  }
};

// Forgot Password - Request password reset
export const forgotPassword = async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findOne({ where: { email: value.email } });

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({
        message:
          "If your email is registered, you will receive a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({
      reset_password_token: resetTokenHash,
      reset_password_expiry: resetTokenExpiry,
    });

    // Send password reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return res
        .status(500)
        .json({ error: "Failed to send password reset email" });
    }

    res.status(200).json({
      message:
        "If your email is registered, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
};

// Reset Password - Complete password reset with token
export const resetPassword = async (req, res) => {
  try {
    const schema = Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Find users with non-null reset token that hasn't expired
    const users = await User.findAll({
      where: {
        reset_password_token: { [Op.ne]: null },
        reset_password_expiry: { [Op.gt]: new Date() },
      },
    });

    // Find user with matching token
    let matchedUser = null;
    for (const user of users) {
      const isTokenValid = await bcrypt.compare(
        value.token,
        user.reset_password_token
      );
      if (isTokenValid) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(value.newPassword, 10);

    // Update password and clear reset token
    await matchedUser.update({
      password_hash: newPasswordHash,
      reset_password_token: null,
      reset_password_expiry: null,
    });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(
      matchedUser.email,
      matchedUser.name
    );

    res.status(200).json({
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(1).optional(),
      bio: Joi.string().max(500).allow("", null).optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (value.name !== undefined) updateData.name = value.name;
    if (value.bio !== undefined) updateData.bio = value.bio;

    // Update user
    await user.update(updateData);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership_number: user.membership_number,
        matric_number: user.matric_number,
        faculty: user.faculty,
        bio: user.bio,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      value.currentPassword,
      user.password_hash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(value.newPassword, 10);

    // Update password
    await user.update({
      password_hash: newPasswordHash,
    });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(user.email, user.name);

    // Send in-app notification + email (force email for security)
    try {
      await NotificationService.notifyUser(
        user.id,
        "Password Changed",
        "Your password was successfully changed. If you didn't make this change, please contact support immediately.",
        "system",
        true // Force email for security notifications
      );
    } catch (notificationError) {
      // Log error but don't fail password change
      console.error("Failed to send password change notification:", notificationError);
    }

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Upload profile avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old avatar from Cloudinary if exists
    if (user.avatar_url) {
      await deleteAvatarFile(user.avatar_url);
    }

    // Get Cloudinary URL from the uploaded file
    const avatarUrl = req.file.path; // Cloudinary URL

    // Update user's avatar_url with the Cloudinary URL
    await user.update({ avatar_url: avatarUrl });

    res.status(200).json({
      message: "Avatar uploaded successfully",
      avatar_url: avatarUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: avatarUrl,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      error: "Failed to upload avatar",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete profile avatar
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.avatar_url) {
      return res.status(400).json({ error: "No avatar to delete" });
    }

    // Delete avatar file from Cloudinary
    await deleteAvatarFile(user.avatar_url);

    // Update user's avatar_url to null
    await user.update({ avatar_url: null });

    res.status(200).json({
      message: "Avatar deleted successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: null,
      },
    });
  } catch (error) {
    console.error("Delete avatar error:", error);
    res.status(500).json({ error: "Failed to delete avatar" });
  }
};

// Serve avatar image - DEPRECATED: Avatars are now served directly from Cloudinary
export const getAvatar = async (req, res) => {
  // Avatars are now stored as Cloudinary URLs and served directly from there
  return res.status(410).json({ 
    error: "This endpoint is deprecated. Avatars are now served directly from Cloudinary.",
    message: "Please use the avatar_url returned by the user API."
  });
};

// Delete account
export const deleteAccount = async (req, res) => {
  try {
    const schema = Joi.object({
      password: Joi.string().required(),
      confirmText: Joi.string().valid("DELETE").required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      value.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Store user info before deletion for email
    const userName = user.name;
    const userEmail = user.email;

    // Delete the user account
    await user.destroy();

    // Send account deletion confirmation email
    await emailService.sendAccountDeletedEmail(userEmail, userName);

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};
