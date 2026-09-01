const User = require('../models/User');

// @desc    Get all pending users (Admin only)
// @route   GET /api/users/:userId/pending
// @access  Protected (Admin)
const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'PENDING' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingUsers.length,
      users: pendingUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending users', error: error.message });
  }
};

// @desc    Get all users with optional filtering & search (Admin only)
// @route   GET /api/users/:userId/all
// @access  Protected (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { status, role, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// @desc    Approve / Reject / Activate / Deactivate user status (Admin only)
// @route   PATCH /api/users/:userId/status/:targetUserId
// @access  Protected (Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'ACTIVE', 'REJECTED', 'DEACTIVATED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status provided. Allowed values: ${validStatuses.join(', ')}` 
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Permission Check: Admins cannot deactivate or reject other Admin accounts
    if (targetUser.role === 'ADMIN' && (status === 'DEACTIVATED' || status === 'REJECTED')) {
      return res.status(403).json({ 
        message: 'Permission denied: Administrators do not have permission to deactivate or reject other Admin accounts.' 
      });
    }

    targetUser.status = status;
    await targetUser.save();

    res.json({
      success: true,
      message: `User '${targetUser.name}' status updated to ${status}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
};

// @desc    Update user role (Admin only)
// @route   PATCH /api/users/:userId/role/:targetUserId
// @access  Protected (Admin)
const updateUserRole = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { role } = req.body;

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: "Role must be 'USER' or 'ADMIN'" });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User '${user.name}' role updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  updateUserStatus,
  updateUserRole
};
