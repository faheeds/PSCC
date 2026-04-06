import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "member-media");

export async function saveMemberMediaFile(file: File) {
  if (!file.size) {
    throw new Error("Choose a photo or short video to upload.");
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new Error("Only image and video uploads are supported.");
  }

  const maxSizeBytes = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(isVideo ? "Video files must be 25MB or smaller." : "Image files must be 10MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name || "") || (isVideo ? ".mp4" : ".jpg");
  const storedFileName = `${randomUUID()}${extension}`;

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, storedFileName), buffer);

  return {
    filePath: `/uploads/member-media/${storedFileName}`,
    fileName: file.name || storedFileName,
    mimeType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
    sizeBytes: file.size
  };
}
