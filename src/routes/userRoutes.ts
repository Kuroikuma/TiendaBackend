const express = require('express')
import { register, login, getUserProfile } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router()

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getUserProfile);

export default router;
