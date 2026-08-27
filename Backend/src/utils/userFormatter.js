export const formatUserForResponse = (user) => {
    if (!user) return null;
    const { password: _, usedStorage, storageLimit, ...rest } = user;
    return {
        ...rest,
        ...(usedStorage !== undefined && { usedStorage: Number(usedStorage) }),
        ...(storageLimit !== undefined && { storageLimit: Number(storageLimit) })
    };
};
