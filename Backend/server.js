import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { startTrashCleanupScheduler } from "./src/services/trashScheduler.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startTrashCleanupScheduler();
});