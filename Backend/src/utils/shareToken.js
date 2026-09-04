import crypto from "crypto";

export const generateShareToken = () => {
    return crypto.randomBytes(32).toString("hex");
};
