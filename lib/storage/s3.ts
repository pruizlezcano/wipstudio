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

const S3_BUCKET = process.env.S3_BUCKET;
if (!S3_BUCKET) {
  throw new Error("S3_BUCKET environment variable is not set");
}
const S3_REGION = process.env.S3_REGION || "";
const S3_ENDPOINT = process.env.S3_ENDPOINT;
if (!S3_ENDPOINT) {
  throw new Error("S3_ENDPOINT environment variable is not set");
}
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
  throw new Error("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables must be set");
}



// Create S3 client using AWS SDK
export const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

// Ensure bucket exists
export async function ensureBucketExists(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    console.log(`S3 bucket "${S3_BUCKET}" already exists`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If bucket doesn't exist, create it
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`Creating S3 bucket: ${S3_BUCKET}`);
      await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
      console.log(`S3 bucket "${S3_BUCKET}" created successfully`);
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
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: objectKey,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Generate presigned URL for downloading/viewing (GET)
export async function generatePresignedGetUrl(
  objectKey: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: objectKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Delete an object from S3
export async function deleteS3File(objectKey: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
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
  const command = new CreateMultipartUploadCommand({
    Bucket: S3_BUCKET,
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
  const command = new UploadPartCommand({
    Bucket: S3_BUCKET,
    Key: objectKey,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Complete a multipart upload
export async function completeMultipartUpload(
  objectKey: string,
  uploadId: string,
  parts: Array<{ PartNumber: number; ETag: string }>
): Promise<void> {
  const command = new CompleteMultipartUploadCommand({
    Bucket: S3_BUCKET,
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
  const command = new AbortMultipartUploadCommand({
    Bucket: S3_BUCKET,
    Key: objectKey,
    UploadId: uploadId,
  });

  await s3Client.send(command);
}
