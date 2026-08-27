import React from "react";

export const DownloadIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="rgba(59, 130, 246, 0.18)" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
        <path d="M7 10l5 5 5-5M12 15V3" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const MoveIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="rgba(139, 92, 246, 0.18)" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />
        <path d="M11 12h6M14 9l3 3-3 3" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const RenameIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 20h9" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="rgba(14, 165, 233, 0.18)" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

export const DeleteIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M21 4H8l-6 8 6 8h13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 9l-6 6M12 9l6 6" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const BackArrowIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);
