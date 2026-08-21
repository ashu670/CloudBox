import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import passport from './config/passport.js';

const app = express();

/* ---------------------- Middleware ---------------------- */

app.use(helmet());
app.use(compression());
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const cleanOrigin = origin.replace(/\/+$/, "");
            if (
                cleanOrigin.includes("localhost") ||
                cleanOrigin.endsWith(".vercel.app") ||
                cleanOrigin.endsWith(".onrender.com") ||
                (process.env.FRONTEND_URL && cleanOrigin === process.env.FRONTEND_URL.replace(/\/+$/, ""))
            ) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

/* ---------------------- Routes ---------------------- */

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "CloudBox Backend Running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/folder", folderRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/activity", activityRoutes);

/* ---------------------- 404 Handler ---------------------- */

app.use((req, res) => {
    return res.status(404).json({
        error: "Route not found",
    });
});

export default app;