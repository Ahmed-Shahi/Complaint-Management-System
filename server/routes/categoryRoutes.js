const express = require('express');
const router = express.Router();
const { getCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { verifyUserToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/:userId', verifyUserToken, getCategories);
router.post('/:userId', verifyUserToken, verifyAdmin, createCategory);
router.delete('/:userId/:categoryId', verifyUserToken, verifyAdmin, deleteCategory);

module.exports = router;
