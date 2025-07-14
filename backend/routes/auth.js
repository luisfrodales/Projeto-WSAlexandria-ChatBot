import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, generateGuestSession, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user - Enhanced with strict validation
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long',
        code: 'INVALID_PASSWORD'
      });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    // Enhanced security: Don't reveal if user exists or not
    if (!user) {
      console.log(`❌ Login attempt failed: User not found - ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`❌ Login attempt failed: Inactive account - ${email}`);
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password with enhanced security
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log(`❌ Login attempt failed: Invalid password - ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Log successful login
    console.log(`✅ Successful login: ${user.email} (${user.username})`);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token,
      loginTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.',
      code: 'LOGIN_ERROR'
    });
  }
});

// Create guest session
router.post('/guest-session', async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const guest = await generateGuestSession(ipAddress, userAgent);

    res.status(201).json({
      message: 'Guest session created',
      sessionId: guest.sessionId,
      token: guest.token,
      expiresAt: new Date(guest.lastActivity.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    });
  } catch (error) {
    console.error('Guest session creation error:', error);
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// Refresh guest session
router.post('/guest-session/refresh', async (req, res) => {
  try {
    const { sessionId, token } = req.body;

    if (!sessionId || !token) {
      return res.status(400).json({ error: 'Session ID and token are required' });
    }

    const guest = await Guest.findOne({ sessionId, token, isActive: true });

    if (!guest) {
      return res.status(401).json({ error: 'Invalid guest session' });
    }

    if (guest.isExpired()) {
      return res.status(401).json({ error: 'Guest session expired' });
    }

    await guest.refreshSession();

    res.json({
      message: 'Guest session refreshed',
      sessionId: guest.sessionId,
      token: guest.token,
      expiresAt: new Date(guest.lastActivity.getTime() + 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Guest session refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh guest session' });
  }
});

// Get current user profile - Protected route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile - Protected route
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const updates = {};

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
      updates.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password - Protected route
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router; 