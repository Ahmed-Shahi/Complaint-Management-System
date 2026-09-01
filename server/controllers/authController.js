const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_jwt_key_cms_2026', {
    expiresIn: '7d'
  });
};

// @desc    Register a new user (Status = PENDING)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Registration request received for:', email);
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'USER',
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Your status is PENDING approval by an Admin.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.name === 'ValidationError' || error.code === 11000) {
      return res.status(400).json({ message: error.message || 'Validation error during registration' });
    }
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// @desc    Login user & set Token_<userId> cookie
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check user account status
    if (user.status !== 'ACTIVE') {
      let statusMessage = 'Your account status is PENDING. Please wait for Admin approval.';
      if (user.status === 'REJECTED') {
        statusMessage = 'Your account registration was REJECTED by an Admin.';
      } else if (user.status === 'DEACTIVATED') {
        statusMessage = 'Your account has been DEACTIVATED by an Admin.';
      }

      return res.status(403).json({
        success: false,
        message: statusMessage,
        status: user.status
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Save token cookie matching requirement Token_<userId>
    const cookieName = `Token_${user._id}`;
    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Set to true if HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// @desc    Logout user & clear Token_<userId> cookie
// @route   POST /api/auth/logout/:userId
// @access  Public / Protected
const logoutUser = (req, res) => {
  const { userId } = req.params;
  if (userId) {
    const cookieName = `Token_${userId}`;
    res.clearCookie(cookieName);
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me/:userId
// @access  Protected
const getMe = (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe
};
