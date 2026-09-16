export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === null || bytes === undefined || bytes === "" || isNaN(Number(bytes))) {
        return "0 Bytes";
    }
    const num = Number(bytes);
    if (num <= 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
    const i = Math.floor(Math.log(num) / Math.log(k));
    const safeIndex = Math.max(0, Math.min(i, sizes.length - 1));
    return parseFloat((num / Math.pow(k, safeIndex)).toFixed(dm)) + " " + sizes[safeIndex];
};

export const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch {
        return "-";
    }
};