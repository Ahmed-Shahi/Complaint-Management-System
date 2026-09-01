const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getMe } = require('../controllers/authController');
const { verifyUserToken } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout/:userId', logoutUser);
router.get('/me/:userId', verifyUserToken, getMe);

module.exports = router;
