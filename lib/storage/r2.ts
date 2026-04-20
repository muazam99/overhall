import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageEnv } from "@/lib/env";

const DEFAULT_UPLOAD_URL_TTL_SECONDS = 60 * 15;

let cachedR2Client: S3Client | null = null;

function normalizeObjectPath(path: string) {
  return path.replace(/^\/+/, "").trim();
}

function getR2Client() {
  if (cachedR2Client) {
    return cachedR2Client;
  }

  const env = getStorageEnv();
  cachedR2Client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return cachedR2Client;
}

export function buildHallPhotoPath(hallId: string, fileName: string) {
  const sanitizedName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeName = sanitizedName.length > 0 ? sanitizedName : "photo";
  return `halls/${hallId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

export async function createHallPhotoUploadUrl({
  path,
  contentType,
  expiresInSeconds = DEFAULT_UPLOAD_URL_TTL_SECONDS,
}: {
  path: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const env = getStorageEnv();
  const key = normalizeObjectPath(path);
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return { uploadUrl, path: key };
}

export async function deleteHallPhotoObject(path: string) {
  const env = getStorageEnv();
  const key = normalizeObjectPath(path);
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}

export function getHallPhotoPublicUrl(path: string) {
  const env = getStorageEnv();
  const key = normalizeObjectPath(path);

  if (env.R2_PUBLIC_BASE_URL) {
    const base = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
    return `${base}/${key}`;
  }

  return `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}
