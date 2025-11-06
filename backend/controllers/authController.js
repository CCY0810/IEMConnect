import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/User.js';
import { generateTwoFACode, hashTwoFACode, verifyTwoFACode, isTwoFACodeExpired } from '../utils/twofa.js';
import emailService from '../utils/emailService.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
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
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUser = await User.findOne({ where: { email: value.email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(value.password, 10);

    const user = await User.create({
      name: value.name,
      email: value.email,
      password_hash: passwordHash,
      membership_number: value.membership_number,
      is_verified: false,
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name);

    res.status(201).json({
      message: 'Registration successful. Your account is pending admin verification.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
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

    if (!user || !user.is_verified) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(value.password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
      console.error('Failed to send 2FA code:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send 2FA code' });
    }

    // Generate temporary token
    const tempToken = jwt.sign(
      { id: user.id, state: '2FA_PENDING' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.status(200).json({ 
      tempToken,
      message: '2FA code sent to your email'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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
      return res.status(401).json({ error: 'No 2FA code found' });
    }

    if (isTwoFACodeExpired(user.two_fa_code_expiry)) {
      return res.status(401).json({ error: 'Invalid or expired 2FA code' });
    }

    const isCodeValid = await verifyTwoFACode(value.code, user.two_fa_code_hash);
    if (!isCodeValid) {
      return res.status(401).json({ error: 'Invalid or expired 2FA code' });
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
      },
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: '2FA verification failed' });
  }
};

export const logout = async (req, res) => {
  try {
    // In a real implementation, you would invalidate the token here
    // For JWT, this typically involves adding the token to a blacklist
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const verifySession = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'membership_number']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership_number: user.membership_number,
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
};

export const resend2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || !user.two_fa_code_hash || !user.two_fa_code_expiry) {
      return res.status(400).json({ error: 'No 2FA code found' });
    }

    // Check if 2FA code is still valid
    if (isTwoFACodeExpired(user.two_fa_code_expiry)) {
      return res.status(400).json({ error: '2FA code has expired. Please login again.' });
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
      console.error('Failed to send 2FA code:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send 2FA code' });
    }

    res.status(200).json({ message: 'New 2FA code sent to your email' });
  } catch (error) {
    console.error('Resend 2FA error:', error);
    res.status(500).json({ error: 'Failed to resend 2FA code' });
  }
};