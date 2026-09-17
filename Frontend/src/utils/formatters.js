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

export const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec <= 0 || !isFinite(bytesPerSec)) {
        return "0 B/s";
    }
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
    const safeIndex = Math.max(0, Math.min(i, sizes.length - 1));
    return parseFloat((bytesPerSec / Math.pow(k, safeIndex)).toFixed(1)) + " " + sizes[safeIndex];
};

export const formatRemainingTime = (seconds) => {
    if (seconds === null || seconds === undefined || !isFinite(seconds) || seconds <= 0) {
        return "Calculating...";
    }
    if (seconds < 60) {
        return `~${Math.max(1, Math.round(seconds))} sec left`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins < 60) {
        return `~${mins} min ${secs > 0 ? `${secs}s ` : ""}left`;
    }
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `~${hours}h ${remainMins > 0 ? `${remainMins}m ` : ""}left`;
};