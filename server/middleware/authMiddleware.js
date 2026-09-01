const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyUserToken = async (req, res, next) => {
  try {
    // Extract userId parameter from route params (supports :userId or :id)
    const paramUserId = req.params.userId || req.params.id;

    if (!paramUserId) {
      return res.status(400).json({ message: 'User ID route parameter is required' });
    }

    // Cookie name convention required: Token_<userId>
    const cookieName = `Token_${paramUserId}`;
    const token = req.cookies[cookieName];

    if (!token) {
      return res.status(401).json({ 
        message: `Unauthorized. Authentication token cookie '${cookieName}' missing or expired.` 
      });
    }

    // Verify JWT payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_cms_2026');

    // Verify parameter ID matches token payload ID
    if (decoded.id.toString() !== paramUserId.toString()) {
      return res.status(401).json({ 
        message: 'Unauthorized. Token ID does not match route param ID.' 
      });
    }

    // Retrieve user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Enforce active account status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ 
        message: `Account status is '${user.status}'. Access denied until admin approval.`,
        status: user.status
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired authentication token', error: error.message });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

module.exports = {
  verifyUserToken,
  verifyAdmin
};
