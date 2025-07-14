import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Guest from '../models/Guest.js';

// Middleware to authenticate JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to authenticate guest session
export const authenticateGuest = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const token = req.headers['x-guest-token'];

    if (!sessionId || !token) {
      return res.status(401).json({ 
        error: 'Guest session required',
        code: 'MISSING_GUEST_SESSION'
      });
    }

    const guest = await Guest.findOne({ 
      sessionId, 
      token, 
      isActive: true 
    });

    if (!guest) {
      return res.status(401).json({ 
        error: 'Invalid guest session',
        code: 'INVALID_GUEST_SESSION'
      });
    }

    // Check if session is expired
    if (guest.isExpired()) {
      return res.status(401).json({ 
        error: 'Guest session expired',
        code: 'GUEST_SESSION_EXPIRED'
      });
    }

    // Refresh session activity
    await guest.refreshSession();

    req.guest = guest;
    next();
  } catch (error) {
    console.error('Guest authentication error:', error);
    return res.status(500).json({ 
      error: 'Guest authentication error',
      code: 'GUEST_AUTH_ERROR'
    });
  }
};

// Optional authentication - works with both user and guest
export const optionalAuth = async (req, res, next) => {
  try {
    // Try to authenticate as user first
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId).select('-password');
          if (user && user.isActive) {
            req.user = user;
            return next();
          }
        } catch (error) {
          // Token is invalid, continue to guest auth
        }
      }
    }

    // Try to authenticate as guest
    const sessionId = req.headers['x-session-id'];
    const guestToken = req.headers['x-guest-token'];
    
    if (sessionId && guestToken) {
      const guest = await Guest.findOne({ 
        sessionId, 
        token: guestToken, 
        isActive: true 
      });

      if (guest && !guest.isExpired()) {
        await guest.refreshSession();
        req.guest = guest;
        return next();
      }
    }

    // No authentication provided, continue without user/guest
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

// Middleware to require authentication (either user or guest)
export const requireAuth = async (req, res, next) => {
  try {
    // Try to authenticate as user first
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId).select('-password');
          if (user && user.isActive) {
            req.user = user;
            return next();
          }
        } catch (error) {
          // Token is invalid, continue to guest auth
        }
      }
    }

    // Try to authenticate as guest
    const sessionId = req.headers['x-session-id'];
    const guestToken = req.headers['x-guest-token'];
    
    if (sessionId && guestToken) {
      const guest = await Guest.findOne({ 
        sessionId, 
        token: guestToken, 
        isActive: true 
      });

      if (guest && !guest.isExpired()) {
        await guest.refreshSession();
        req.guest = guest;
        return next();
      }
    }

    // No valid authentication found
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTHENTICATION_REQUIRED'
    });
  } catch (error) {
    console.error('Require auth error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Generate guest session
export const generateGuestSession = async (ipAddress, userAgent) => {
  const guest = new Guest({
    ipAddress,
    userAgent
  });
  
  await guest.save();
  return guest;
}; 