import { getHallPhotoPublicUrl } from "@/lib/storage/r2";

export function resolveHallPhotoUrl(path: string | null | undefined) {
  const normalizedPath = path?.trim() ?? "";
  if (normalizedPath.length === 0) {
    return null;
  }

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("//")
  ) {
    return normalizedPath;
  }

  try {
    return getHallPhotoPublicUrl(normalizedPath);
  } catch {
    return null;
  }
}
