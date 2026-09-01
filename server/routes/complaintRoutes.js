const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintDetail,
  updateComplaintStatus
} = require('../controllers/complaintController');
const { verifyUserToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/:userId', verifyUserToken, createComplaint);
router.get('/:userId/my-complaints', verifyUserToken, getMyComplaints);
router.get('/:userId/all', verifyUserToken, verifyAdmin, getAllComplaints);
router.get('/:userId/detail/:complaintId', verifyUserToken, getComplaintDetail);
router.patch('/:userId/status/:complaintId', verifyUserToken, verifyAdmin, updateComplaintStatus);

module.exports = router;
