// src/config/multerConfig.js
import multer from 'multer';

// Multer only parses multipart form-data and puts raw binary into a buffer
const upload = multer({
    storage: multer.memoryStorage()
});

export default upload;