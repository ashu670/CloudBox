import React from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileCode,
  Archive,
  File
} from "lucide-react";

export default function FileIcon({ mimeType }) {
  if (!mimeType) {
    return <File size={20} color="#94a3b8" />;
  }

  if (mimeType.startsWith("image/")) {
    return <ImageIcon size={20} color="#38bdf8" />;
  }

  if (mimeType === "application/pdf") {
    return <FileText size={20} color="#f43f5e" />;
  }

  if (mimeType.startsWith("video/")) {
    return <Video size={20} color="#34d399" />;
  }

  if (mimeType.startsWith("audio/")) {
    return <Music size={20} color="#fbbf24" />;
  }

  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("xml") ||
    mimeType.includes("html")
  ) {
    return <FileCode size={20} color="#a78bfa" />;
  }

  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("compressed") ||
    mimeType.includes("rar")
  ) {
    return <Archive size={20} color="#f97316" />;
  }

  return <File size={20} color="#94a3b8" />;
}