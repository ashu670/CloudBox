import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";

const app = express();

/* ---------------------- Middleware ---------------------- */

// Security headers
app.use(helmet());

// Compress responses
app.use(compression());

// Allow frontend requests
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// Parse JSON request body
app.use(express.json());

// Parse URL encoded data
app.use(express.urlencoded({ extended: true }));

// Parse Cookies
app.use(cookieParser());

/* ---------------------- Routes ---------------------- */

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "CloudBox Backend Running 🚀",
    });
});

app.use("/api/auth", authRoutes);

/* ---------------------- 404 Handler ---------------------- */

app.use((req, res) => {
    return res.status(404).json({
        error: "Route not found",
    });
});

export default app;