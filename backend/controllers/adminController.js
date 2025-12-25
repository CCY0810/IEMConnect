/**
 * Admin Controller
 * Handles admin-specific operations:
 * - Admin invites
 * - Role management (promote/demote)
 * - User listing
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import Joi from "joi";
import User from "../models/User.js";
import AdminInvite from "../models/AdminInvite.js";
import emailService from "../utils/emailService.js";

/**
 * Create admin invite
 * POST /api/v1/admin/invite
 */
export const createAdminInvite = async (req, res) => {
  try {
    // Verify requester is admin
    const admin = await User.findByPk(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const schema = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ where: { email: value.email } });
    if (existingUser) {
      return res.status(400).json({ error: "This email is already registered" });
    }

    // Check for existing unexpired invite
    const existingInvite = await AdminInvite.findOne({
      where: {
        email: value.email,
        used_at: null,
      },
    });

    if (existingInvite && new Date(existingInvite.expires_at) > new Date()) {
      return res.status(400).json({ 
        error: "An active invite already exists for this email" 
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite record
    await AdminInvite.create({
      email: value.email,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: admin.id,
    });

    // Send invite email
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-invite/${token}`;
    
    try {
      await emailService.sendAdminInviteEmail(value.email, value.name || 'Admin', inviteUrl, admin.name);
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Still return success, but warn about email
      return res.status(201).json({
        message: "Invite created but email could not be sent",
        inviteUrl, // Include URL so admin can share manually
        expiresAt,
        warning: "Email delivery failed. Please share the invite link manually."
      });
    }

    res.status(201).json({
      message: `Admin invite sent to ${value.email}`,
      expiresAt,
    });
  } catch (error) {
    console.error("Create admin invite error:", error);
    res.status(500).json({ error: "Failed to create admin invite" });
  }
};

/**
 * Validate invite token
 * GET /api/v1/admin/invite/:token
 */
export const validateInviteToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Find all unexpired, unused invites
    const invites = await AdminInvite.findAll({
      where: {
        used_at: null,
      },
    });

    // Find matching invite
    let matchedInvite = null;
    for (const invite of invites) {
      const isTokenValid = await bcrypt.compare(token, invite.token_hash);
      if (isTokenValid) {
        matchedInvite = invite;
        break;
      }
    }

    if (!matchedInvite) {
      return res.status(404).json({ error: "Invalid or expired invite token" });
    }

    // Check expiration
    if (new Date(matchedInvite.expires_at) < new Date()) {
      return res.status(400).json({ error: "This invite has expired" });
    }

    res.status(200).json({
      valid: true,
      email: matchedInvite.email,
      expiresAt: matchedInvite.expires_at,
    });
  } catch (error) {
    console.error("Validate invite token error:", error);
    res.status(500).json({ error: "Failed to validate invite token" });
  }
};

/**
 * Register with admin invite
 * POST /api/v1/admin/register
 */
export const registerWithInvite = async (req, res) => {
  try {
    const schema = Joi.object({
      token: Joi.string().required(),
      name: Joi.string().required(),
      password: Joi.string().min(6).required(),
      membership_number: Joi.string().length(6).required(),
      matric_number: Joi.string().length(9).required(),
      faculty: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Find and validate invite
    const invites = await AdminInvite.findAll({
      where: { used_at: null },
    });

    let matchedInvite = null;
    for (const invite of invites) {
      const isTokenValid = await bcrypt.compare(value.token, invite.token_hash);
      if (isTokenValid) {
        matchedInvite = invite;
        break;
      }
    }

    if (!matchedInvite) {
      return res.status(400).json({ error: "Invalid or expired invite token" });
    }

    if (new Date(matchedInvite.expires_at) < new Date()) {
      return res.status(400).json({ error: "This invite has expired" });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ where: { email: matchedInvite.email } });
    if (existingUser) {
      return res.status(400).json({ error: "This email is already registered" });
    }

    // Check matric number
    const existingMatric = await User.findOne({ where: { matric_number: value.matric_number } });
    if (existingMatric) {
      return res.status(400).json({ error: "Matric number already registered" });
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(value.password, 10);
    const newAdmin = await User.create({
      name: value.name,
      email: matchedInvite.email,
      password_hash: passwordHash,
      membership_number: value.membership_number,
      matric_number: value.matric_number,
      faculty: value.faculty,
      role: "admin", // Automatically set as admin
      is_verified: 1, // Pre-verified
    });

    // Mark invite as used
    await matchedInvite.update({
      used_at: new Date(),
      used_by: newAdmin.id,
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(matchedInvite.email, value.name);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.status(201).json({
      message: "Admin account created successfully! You can now login.",
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Register with invite error:", error);
    res.status(500).json({ error: "Failed to complete registration" });
  }
};

/**
 * Promote member to admin
 * POST /api/v1/admin/promote
 */
export const promoteToAdmin = async (req, res) => {
  try {
    // Verify requester is admin
    const admin = await User.findByPk(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userToPromote = await User.findByPk(userId);
    if (!userToPromote) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userToPromote.role === "admin") {
      return res.status(400).json({ error: "User is already an admin" });
    }

    await userToPromote.update({ role: "admin" });

    // Send notification email
    try {
      await emailService.sendRoleChangeEmail(
        userToPromote.email,
        userToPromote.name,
        "admin",
        admin.name
      );
    } catch (emailError) {
      console.error("Failed to send role change email:", emailError);
    }

    res.status(200).json({
      message: `${userToPromote.name} has been promoted to admin`,
      user: {
        id: userToPromote.id,
        name: userToPromote.name,
        email: userToPromote.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Promote to admin error:", error);
    res.status(500).json({ error: "Failed to promote user" });
  }
};

/**
 * Demote admin to member
 * POST /api/v1/admin/demote
 */
export const demoteToMember = async (req, res) => {
  try {
    // Verify requester is admin
    const admin = await User.findByPk(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Prevent self-demotion
    if (userId === admin.id) {
      return res.status(400).json({ error: "You cannot demote yourself" });
    }

    const userToDemote = await User.findByPk(userId);
    if (!userToDemote) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userToDemote.role === "member") {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Check if this is the last admin
    const adminCount = await User.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return res.status(400).json({ 
        error: "Cannot demote the last admin. Promote another user first." 
      });
    }

    await userToDemote.update({ role: "member" });

    // Send notification email
    try {
      await emailService.sendRoleChangeEmail(
        userToDemote.email,
        userToDemote.name,
        "member",
        admin.name
      );
    } catch (emailError) {
      console.error("Failed to send role change email:", emailError);
    }

    res.status(200).json({
      message: `${userToDemote.name} has been demoted to member`,
      user: {
        id: userToDemote.id,
        name: userToDemote.name,
        email: userToDemote.email,
        role: "member",
      },
    });
  } catch (error) {
    console.error("Demote to member error:", error);
    res.status(500).json({ error: "Failed to demote user" });
  }
};

/**
 * Get all users (for admin user management)
 * GET /api/v1/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    // Verify requester is admin
    const admin = await User.findByPk(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const users = await User.findAll({
      attributes: [
        "id", "name", "email", "role", "membership_number", 
        "matric_number", "faculty", "is_verified", "createdAt"
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Get pending admin invites
 * GET /api/v1/admin/invites
 */
export const getPendingInvites = async (req, res) => {
  try {
    // Verify requester is admin
    const admin = await User.findByPk(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const invites = await AdminInvite.findAll({
      where: { used_at: null },
      attributes: ["id", "email", "expires_at", "created_by", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ invites });
  } catch (error) {
    console.error("Get pending invites error:", error);
    res.status(500).json({ error: "Failed to fetch invites" });
  }
};

/**
 * Revoke admin invite
 * DELETE /api/v1/admin/invite/:id
 */
export const revokeInvite = async (req, res) => {
  try {
    // Verify requester is admin
    const admin = await User.findByPk(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const invite = await AdminInvite.findByPk(id);

    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (invite.used_at) {
      return res.status(400).json({ error: "This invite has already been used" });
    }

    await invite.destroy();

    res.status(200).json({ message: "Invite revoked successfully" });
  } catch (error) {
    console.error("Revoke invite error:", error);
    res.status(500).json({ error: "Failed to revoke invite" });
  }
};
