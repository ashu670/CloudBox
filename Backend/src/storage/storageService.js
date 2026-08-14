import minioClient from '../config/minio.js';
import { Readable } from 'stream';

const bucket = process.env.MINIO_BUCKET;

const storageService = {
    async store(file, storageName) {
        if (!file || !file.buffer) {
            throw new Error('Invalid file object: Missing memory buffer data chunks');
        }

        const mimeType = file.mimetype || 'application/octet-stream';

        await minioClient.putObject(
            bucket,
            storageName,
            file.buffer,
            file.size,
            {
                "Content-Type": mimeType
            }
        );

        return {
            success: true,
            stoName: storageName
        };
    },

    async exists(storageName) {
        try {
            await minioClient.statObject(bucket, storageName);
            return true;
        } catch (error) {
            if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
                return false;
            }
            return false;
        }
    },
    async delete(storageName) {
        try {
            await minioClient.removeObject(bucket, storageName);
            return { success: true };
        } catch (error) {
            console.error("Storage delete error:", error);
            throw error;
        }
    },
    async rename(oldName, newName) {
        await minioClient.copyObject(
            bucket,
            newName,
            `/${bucket}/${oldName}`
        );

        await minioClient.removeObject(bucket, oldName);

        return {
            success: true,
            stoName: newName
        };
    },
    async download(storageName) {
        const stream = await minioClient.getObject(
            bucket,
            storageName
        );

        if (typeof stream.pipe === "function") {
            return stream;
        }
        if (typeof stream.getReader === "function") {
            return Readable.fromWeb(stream);
        }
        if (typeof stream[Symbol.asyncIterator] === "function") {
            return Readable.from(stream);
        }

        throw new Error("Unsupported stream returned by MinIO");
    }
};

export default storageService;