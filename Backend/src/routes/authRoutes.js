import { Router } from "express";
import * as authCon from '../controllers/authController.js';
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import passport from "../config/passport.js";


const router = Router();

// Google O_AUTH routes

router.get('/google', passport.authenticate("google", {scope : ["profile", "email"], session : false}));

router.get(
    '/google/callback',
    passport.authenticate("google", {failureRedirect : '/login', session : false}),
    authCon.handleGoogleCallback
);

router.post('/signup', authCon.signup);
router.post('/login', authCon.login);
router.post('/logout', authCon.logout);
router.post('/refresh', authCon.refresh);

//cronjob for waking up the server at every 10 min
router.get('/health', authCon.healthCheck);

router.get('/profile', authenticate, authCon.getProfile);


export default router;