const Complaint = require('../models/Complaint');

// @desc    Submit a new complaint (User only)
// @route   POST /api/complaints/:userId
// @access  Protected (User)
const createComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      userId: req.user._id,
      status: 'PENDING'
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('category', 'name')
      .populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully! Initial status: PENDING',
      complaint: populatedComplaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit complaint', error: error.message });
  }
};

// @desc    Get current user's submitted complaints
// @route   GET /api/complaints/:userId/my-complaints
// @access  Protected (User)
const getMyComplaints = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = { userId: req.user._id };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user complaints', error: error.message });
  }
};

// @desc    Get all complaints with search & filters (Admin only)
// @route   GET /api/complaints/:userId/all
// @access  Protected (Admin)
const getAllComplaints = async (req, res) => {
  try {
    const { status, category, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    let complaints = await Complaint.find(query)
      .populate('category', 'name')
      .populate('userId', 'name email status')
      .sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      complaints = complaints.filter(c => 
        (c.title && c.title.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term)) ||
        (c.userId && c.userId.name && c.userId.name.toLowerCase().includes(term)) ||
        (c.userId && c.userId.email && c.userId.email.toLowerCase().includes(term))
      );
    }

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all complaints', error: error.message });
  }
};

// @desc    Get details of a single complaint
// @route   GET /api/complaints/:userId/detail/:complaintId
// @access  Protected (User owner or Admin)
const getComplaintDetail = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId)
      .populate('category', 'name description')
      .populate('userId', 'name email status');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'ADMIN' && complaint.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this complaint' });
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch complaint detail', error: error.message });
  }
};

// @desc    Update complaint status, subject (title), category, and admin comment (Admin only)
// @route   PATCH /api/complaints/:userId/status/:complaintId
// @access  Protected (Admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, adminComment, title, category } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}` 
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) complaint.status = status;
    if (title && title.trim()) complaint.title = title.trim();
    if (category) complaint.category = category;
    if (adminComment !== undefined) complaint.adminComment = adminComment;

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('category', 'name')
      .populate('userId', 'name email');

    res.json({
      success: true,
      message: `Complaint updated successfully! Status: ${complaint.status}`,
      complaint: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update complaint', error: error.message });
  }
};

// @desc    Update user's own complaint (Allowed ONLY if status === 'PENDING')
// @route   PATCH /api/complaints/:userId/user-update/:complaintId
// @access  Protected (User owner)
const updateUserComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { title, description, category } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own complaints.' });
    }

    // Lock editing if status is no longer PENDING (i.e. Admin has reviewed it)
    if (complaint.status !== 'PENDING') {
      return res.status(403).json({ 
        message: 'Editing locked: Complaints can only be edited while in PENDING status.' 
      });
    }

    if (title) complaint.title = title.trim();
    if (description) complaint.description = description.trim();
    if (category) complaint.category = category;

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('category', 'name');

    res.json({
      success: true,
      message: 'Complaint updated successfully!',
      complaint: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update complaint', error: error.message });
  }
};

// @desc    Delete user's own complaint (Allowed ONLY if status === 'PENDING')
// @route   DELETE /api/complaints/:userId/user-delete/:complaintId
// @access  Protected (User owner)
const deleteUserComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own complaints.' });
    }

    // Lock deletion if status is no longer PENDING
    if (complaint.status !== 'PENDING') {
      return res.status(403).json({ 
        message: 'Deletion locked: Complaints can only be deleted while in PENDING status.' 
      });
    }

    await Complaint.findByIdAndDelete(complaintId);

    res.json({
      success: true,
      message: 'Complaint deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete complaint', error: error.message });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintDetail,
  updateComplaintStatus,
  updateUserComplaint,
  deleteUserComplaint
};
