import { createSHA256 } from 'hash-wasm';

export const calculateFileHash = async (file) => {
    const hasher = createSHA256();
    (await hasher).init();
    
    const chunkSize = 4 * 1024 * 1024;

    for(let i = 0; i < file.size; i += chunkSize){
        const chunk = file.slice(i, i + chunkSize);
        const buffer = await chunk.arrayBuffer();

        (await hasher).update(new Uint8Array(buffer));
    }

    return (await hasher).digest('hex');
};