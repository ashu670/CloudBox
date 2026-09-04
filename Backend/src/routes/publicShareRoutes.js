import express from "express";
import { getPublicShare } from "../controllers/publicShareController.js";

const router = express.Router();

// Unauthenticated public route for resolving file share tokens
router.get("/share/:token", getPublicShare);

export default router;
