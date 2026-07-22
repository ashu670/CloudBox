export default function FileIcon({ mimeType }) {
    if (mimeType.startsWith("image/")) {
        return (
            <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#3b82f6' }}>
                <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M5,5H19V19H5V5Z" />
            </svg>
        );
    }
    if (mimeType === "application/pdf") {
        return (
            <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#ef4444' }}>
                <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M10,17H14V15H10V17M10,13H16V11H10V13M10,9H16V7H10V9Z" />
            </svg>
        );
    }
    // ... rest of your icon conditions ...
    return (
        <svg className="file-svg" viewBox="0 0 24 24" style={{ fill: '#6b7280' }}>
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
    );
}