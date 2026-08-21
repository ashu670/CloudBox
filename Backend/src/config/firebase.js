import dotenv from "dotenv";
dotenv.config();

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

const serviceAccountConfig = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "./serviceAccKey.json";
let bucketName = process.env.FIREBASE_STORAGE_BUCKET || "cloudbox-cec26.appspot.com";

let credential;

try {
    if (typeof serviceAccountConfig === "string" && serviceAccountConfig.trim().startsWith("{")) {
        credential = cert(JSON.parse(serviceAccountConfig));
    } else if (serviceAccountConfig) {
        const resolvedPath = path.resolve(serviceAccountConfig);
        if (fs.existsSync(resolvedPath)) {
            const fileContent = fs.readFileSync(resolvedPath, "utf8");
            credential = cert(JSON.parse(fileContent));
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