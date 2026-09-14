import { cleanupExpired } from "./trashService.js";

let isSchedulerRunning = false;
let cleanupIntervalTimer = null;

export const startTrashCleanupScheduler = (intervalMs = 3600000) => {
    if (isSchedulerRunning) {
        console.log("Trash cleanup scheduler is already running.");
        return;
    }

    isSchedulerRunning = true;
    console.log(`Starting Trash cleanup scheduler (interval: ${intervalMs} ms)...`);

    // Run once on startup asynchronously
    cleanupExpired().catch((err) => {
        console.error("Initial trash cleanup run error:", err.message);
    });

    // Schedule periodic run
    cleanupIntervalTimer = setInterval(() => {
        cleanupExpired().catch((err) => {
            console.error("Scheduled trash cleanup run error:", err.message);
        });
    }, intervalMs);
};

export const stopTrashCleanupScheduler = () => {
    if (cleanupIntervalTimer) {
        clearInterval(cleanupIntervalTimer);
        cleanupIntervalTimer = null;
    }
    isSchedulerRunning = false;
    console.log("Trash cleanup scheduler stopped.");
};
