import dotenv from "dotenv";
dotenv.config();

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

const serviceAccountConfig = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "./serviceAccKey.json";
let bucketName = process.env.FIREBASE_STORAGE_BUCKET || "cloudbox-cec26.firebasestorage.app";

let credential;

const parseServiceAccountKey = (keyString) => {
    // Try parsing directly first (handles single-line JSON stored in env vars)
    let parsed;
    try {
        parsed = JSON.parse(keyString);
    } catch (_) {
        // If direct parse fails, the JSON may contain literal newlines inside string values.
        // Escape only the newlines that appear inside JSON string values by replacing
        // raw newlines that are NOT at object/key boundaries.
        const escaped = keyString.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        parsed = JSON.parse(escaped);
    }
    // The private_key field must contain real newline characters, not the two-char sequence \n
    if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
};

try {
    if (typeof serviceAccountConfig === "string" && serviceAccountConfig.trim().startsWith("{")) {
        credential = cert(parseServiceAccountKey(serviceAccountConfig));
    } else if (serviceAccountConfig) {
        const resolvedPath = path.resolve(serviceAccountConfig);
        if (fs.existsSync(resolvedPath)) {
            const fileContent = fs.readFileSync(resolvedPath, "utf8");
            credential = cert(parseServiceAccountKey(fileContent));
        }
    }
} catch (error) {
    console.error("Error initializing Firebase Service Account credential:", error.message);
}

if (!getApps().length) {
    initializeApp({
        ...(credential ? { credential } : {}),
        storageBucket: bucketName
    });
}

const bucket = getStorage().bucket(bucketName);

export default bucket;