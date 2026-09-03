export const ActivityType = {
    CREATE_FOLDER: "CREATE_FOLDER",
    DELETE_FOLDER: "DELETE_FOLDER",
    RENAME_FOLDER: "RENAME_FOLDER",
    MOVE_FOLDER: "MOVE_FOLDER",

    UPLOAD_FILE: "UPLOAD_FILE",
    DELETE_FILE: "DELETE_FILE",
    RENAME_FILE: "RENAME_FILE",
    MOVE_FILE: "MOVE_FILE",

    SHARE_FOLDER: "SHARE_FOLDER",
    JOIN_REQUEST: "JOIN_REQUEST",
    APPROVE_REQUEST: "APPROVE_REQUEST",
    REJECT_REQUEST: "REJECT_REQUEST",

    ROLE_CHANGED: "ROLE_CHANGED",
    MEMBER_REMOVED: "MEMBER_REMOVED",
    OWNER_TRANSFERRED: "OWNER_TRANSFERRED",

    CREATE_PR: "CREATE_PR",
    APPROVE_PR: "APPROVE_PR",
    REJECT_PR: "REJECT_PR",
    MERGE_PR: "MERGE_PR",
};

export const TargetType = {
    FOLDER: "FOLDER",
    FILE: "FILE",
    MEMBER: "MEMBER",
    PULL_REQUEST: "PULL_REQUEST",
};

export const validateActivityLogInput = ({ folderId, userId, action, target }) => {
    if (!folderId || !Number.isInteger(Number(folderId))) {
        throw new Error("Invalid or missing folderId for activity log.");
    }
    if (!userId || !Number.isInteger(Number(userId))) {
        throw new Error("Invalid or missing userId for activity log.");
    }
    if (!action || !ActivityType[action]) {
        throw new Error(`Invalid or unsupported ActivityType: ${action}`);
    }
    if (!target || !TargetType[target]) {
        throw new Error(`Invalid or unsupported TargetType: ${target}`);
    }
    return true;
};
