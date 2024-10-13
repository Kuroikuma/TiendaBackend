const express = require('express')
import { register, login, getUserProfile } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router()
export const userRouter = express.Router()

userRouter.use(authMiddleware)

router.post('/register', register);
router.post('/login', login);
userRouter.get('/profile', getUserProfile);

export default router;
