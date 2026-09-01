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

    // Client search filter across title, description, user name or user email
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

    // Verify user owns complaint or is Admin
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

// @desc    Update complaint status & add admin comments (Admin only)
// @route   PATCH /api/complaints/:userId/status/:complaintId
// @access  Protected (Admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, adminComment } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}` 
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = status;
    if (adminComment !== undefined) {
      complaint.adminComment = adminComment;
    }
    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('category', 'name')
      .populate('userId', 'name email');

    res.json({
      success: true,
      message: `Complaint status updated to ${status}`,
      complaint: updatedComplaint
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update complaint status', error: error.message });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintDetail,
  updateComplaintStatus
};
