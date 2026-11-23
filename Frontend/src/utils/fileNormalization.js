/**
 * File & StorageObject data normalization layer
 * Ensures logical File and physical StorageObject properties are mapped consistently
 * without requiring scattered defensive property checks throughout UI components.
 */

export function normalizeFile(file) {
    if (!file || typeof file !== 'object') return file;

    const sto = file.storageObject || {};
    const name = file.orgName || file.name || "File";
    const size = Number(sto.size !== undefined && sto.size !== null ? sto.size : (file.size !== undefined && file.size !== null ? file.size : 0));
    const mimeType = sto.mimeType || file.mimeType || "application/octet-stream";
    const storageObjectId = file.storageObjectId || sto.id || null;

    return {
        ...file,
        id: file.id,
        name,
        orgName: name,
        size,
        mimeType,
        folderId: file.folderId !== undefined ? file.folderId : null,
        uid: file.uid !== undefined ? file.uid : null,
        storageObjectId,
        storageObject: file.storageObject || (sto.id ? sto : null),
        createdAt: file.createdAt || new Date().toISOString(),
        updatedAt: file.updatedAt || file.createdAt || new Date().toISOString(),
        deletedAt: file.deletedAt || null,
        user: file.user || null
    };
}

export function normalizeFileList(files) {
    if (!Array.isArray(files)) return [];
    return files.map(normalizeFile);
}

