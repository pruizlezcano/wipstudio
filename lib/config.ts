export interface S3Config {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface EmailConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
  } | null;
  from: string;
}

export interface DatabaseConfig {
  url: string;
}

export interface AuthConfig {
  secret: string;
  requireEmailVerification: boolean;
}

export interface AppConfig {
  url: string;
  uploadChunkSize: number | undefined;
}

// Caches for configuration
let s3ConfigCache: S3Config | null = null;
let emailConfigCache: EmailConfig | null = null;
let databaseConfigCache: DatabaseConfig | null = null;
let authConfigCache: AuthConfig | null = null;
let appConfigCache: AppConfig | null = null;

// ============================================================================
// S3 Configuration
// ============================================================================

export function getS3Config(): S3Config {
  if (s3ConfigCache) {
    return s3ConfigCache;
  }

  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("FATAL: S3_BUCKET environment variable is not set");
  }

  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) {
    throw new Error("FATAL: S3_ENDPOINT environment variable is not set");
  }

  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "FATAL: S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables must be set"
    );
  }

  const region = process.env.S3_REGION || "us-east-1";

  s3ConfigCache = {
    bucket,
    endpoint,
    accessKeyId,
    secretAccessKey,
    region,
  };

  return s3ConfigCache;
}

// ============================================================================
// Email Configuration
// ============================================================================

export function getEmailConfig(): EmailConfig {
  if (emailConfigCache) {
    return emailConfigCache;
  }

  const enabled = process.env.EMAIL_ENABLED !== "false";

  let smtp: EmailConfig["smtp"] = null;

  if (enabled) {
    const host = process.env.SMTP_HOST;
    const portStr = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    if (!host || !portStr || !user || !password) {
      throw new Error(
        "FATAL: SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables must be set when EMAIL_ENABLED is true"
      );
    }

    const port = parseInt(portStr, 10);
    if (isNaN(port)) {
      throw new Error("FATAL: SMTP_PORT must be a valid number");
    }

    smtp = { host, port, user, password };
  }

  const from = process.env.EMAIL_FROM || `Backstage <${process.env.SMTP_USER}>`;

  emailConfigCache = {
    enabled,
    smtp,
    from,
  };

  return emailConfigCache;
}

// ============================================================================
// Database Configuration
// ============================================================================

export function getDatabaseConfig(): DatabaseConfig {
  if (databaseConfigCache) {
    return databaseConfigCache;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("FATAL: DATABASE_URL environment variable is not set");
  }

  databaseConfigCache = { url };
  return databaseConfigCache;
}

// ============================================================================
// Auth Configuration
// ============================================================================

export function getAuthConfig(): AuthConfig {
  if (authConfigCache) {
    return authConfigCache;
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: BETTER_AUTH_SECRET environment variable is not set"
    );
  }

  const requireEmailVerification =
    process.env.REQUIRE_EMAIL_VERIFICATION === "true";

  authConfigCache = {
    secret,
    requireEmailVerification,
  };

  return authConfigCache;
}

// ============================================================================
// App Configuration
// ============================================================================

export function getAppConfig(): AppConfig {
  if (appConfigCache) {
    return appConfigCache;
  }

  const url = process.env.APP_URL || "http://localhost:3000";

  const chunkSizeStr = process.env.UPLOAD_CHUNK_SIZE;
  const uploadChunkSize = chunkSizeStr ? parseInt(chunkSizeStr, 10) : undefined;

  appConfigCache = {
    url,
    uploadChunkSize,
  };

  return appConfigCache;
}
