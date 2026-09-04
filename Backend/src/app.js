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
import publicShareRoutes from "./routes/publicShareRoutes.js";
import passport from './config/passport.js';

const app = express();

/* ---------------------- Middleware ---------------------- */

app.use(helmet());
app.use(compression());
app.use(
    cors({
        origin: (origin, callback) => {
            // Dynamically reflect origin to satisfy CORS with credentials for all frontends
            return callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
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
app.use("/api/public", publicShareRoutes);

/* ---------------------- 404 Handler ---------------------- */

app.use((req, res) => {
    return res.status(404).json({
        error: "Route not found",
    });
});

export default app;