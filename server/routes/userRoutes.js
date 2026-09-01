const express = require('express');
const router = express.Router();
const { getPendingUsers, getAllUsers, updateUserStatus, updateUserRole } = require('../controllers/userController');
const { verifyUserToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/:userId/pending', verifyUserToken, verifyAdmin, getPendingUsers);
router.get('/:userId/all', verifyUserToken, verifyAdmin, getAllUsers);
router.patch('/:userId/status/:targetUserId', verifyUserToken, verifyAdmin, updateUserStatus);
router.patch('/:userId/role/:targetUserId', verifyUserToken, verifyAdmin, updateUserRole);

module.exports = router;
