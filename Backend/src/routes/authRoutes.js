import { Router } from "express";
import * as authCon from '../controllers/authController.js';
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.post('/signup', authCon.signup);
router.post('/login', authCon.login);
router.post('/logout', authCon.logout);
router.post('/refresh', authCon.refresh);

router.get('/profile', authenticate, authCon.getProfile);


export default router;