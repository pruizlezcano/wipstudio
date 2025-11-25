import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Config, getAppConfig } from "@/lib/config";

// Lazy initialization of S3 client for server-side operations
let s3ClientInstance: S3Client | null = null;

function initS3Client(): S3Client {
  if (s3ClientInstance) {
    return s3ClientInstance;
  }

  const config = getS3Config();

  s3ClientInstance = new S3Client({
    region: config.region,
    endpoint: config.endpoint, // Use internal endpoint for server operations
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // Required for MinIO
  });

  return s3ClientInstance;
}

// Lazy initialization of S3 client for presigned URLs using request host
// This ensures presigned URLs use the public-facing domain
let s3PresignedClientInstance: S3Client | null = null;

function initS3PresignedClient(): S3Client {
  if (s3PresignedClientInstance) {
    return s3PresignedClientInstance;
  }

  const s3Config = getS3Config();
  const appConfig = getAppConfig();
  
  // In development, use S3 endpoint directly for presigned URLs
  // In production, use the public app URL (proxy handles routing to S3)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const presignedEndpoint = isDevelopment ? s3Config.endpoint : appConfig.url;

  s3PresignedClientInstance = new S3Client({
    region: s3Config.region,
    endpoint: presignedEndpoint,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    },
    forcePathStyle: true, // Required for MinIO
  });

  return s3PresignedClientInstance;
}

// Export the S3 client using a Proxy for lazy initialization
export const s3Client = new Proxy({} as S3Client, {
  get(target, prop) {
    const client = initS3Client();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const s3PresignedClient = new Proxy({} as S3Client, {
  get(target, prop) {
    const client = initS3PresignedClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Ensure bucket exists
export async function ensureBucketExists(): Promise<void> {
  const config = getS3Config();
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    console.log(`S3 bucket "${config.bucket}" already exists`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If bucket doesn't exist, create it
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`Creating S3 bucket: ${config.bucket}`);
      await s3Client.send(new CreateBucketCommand({ Bucket: config.bucket }));
      console.log(`S3 bucket "${config.bucket}" created successfully`);
    } else {
      console.error("Error ensuring bucket exists:", error.message || error);
      throw error;
    }
  }
}

// Generate presigned URL for uploading (PUT)
export async function generatePresignedPutUrl(
  objectKey: string,
  expiresIn: number = 900, // 15 minutes default
  contentType?: string
): Promise<string> {
  const config = getS3Config();

  // Use presigned client with request host
  const presignedClient = initS3PresignedClient();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  return getSignedUrl(presignedClient, command, { expiresIn });
}

// Generate presigned URL for downloading/viewing (GET)
export async function generatePresignedGetUrl(
  objectKey: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const config = getS3Config();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  });

  return getSignedUrl(s3PresignedClient, command, { expiresIn });
}

// Delete an object from S3
export async function deleteS3File(objectKey: string): Promise<void> {
  const config = getS3Config();
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    })
  );
}

// ===== MULTIPART UPLOAD FUNCTIONS =====

// Initiate a multipart upload
export async function initiateMultipartUpload(
  objectKey: string,
  contentType?: string
): Promise<string> {
  const config = getS3Config();
  const command = new CreateMultipartUploadCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const response = await s3Client.send(command);

  if (!response.UploadId) {
    throw new Error("Failed to initiate multipart upload");
  }

  return response.UploadId;
}

// Generate presigned URL for uploading a single part
export async function generatePresignedPartUrl(
  objectKey: string,
  uploadId: string,
  partNumber: number,
  expiresIn: number = 900 // 15 minutes default
): Promise<string> {
  const config = getS3Config();

  const command = new UploadPartCommand({
    Bucket: config.bucket,
    Key: objectKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return getSignedUrl(s3PresignedClient, command, { expiresIn });
}

// Complete a multipart upload
export async function completeMultipartUpload(
  objectKey: string,
  uploadId: string,
  parts: Array<{ PartNumber: number; ETag: string }>
): Promise<void> {
  const config = getS3Config();
  const command = new CompleteMultipartUploadCommand({
    Bucket: config.bucket,
    Key: objectKey,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  });

  await s3Client.send(command);
}

// Abort a multipart upload (cleanup)
export async function abortMultipartUpload(
  objectKey: string,
  uploadId: string
): Promise<void> {
  const config = getS3Config();
  const command = new AbortMultipartUploadCommand({
    Bucket: config.bucket,
    Key: objectKey,
    UploadId: uploadId,
  });

  await s3Client.send(command);
}
