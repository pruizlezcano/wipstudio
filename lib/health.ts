import { sql } from "drizzle-orm";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import net from "node:net";
import { db } from "@/lib/db/db";
import { getS3Config } from "@/lib/config";
import { s3Client } from "@/lib/storage/s3";

type HealthState = "ok" | "degraded" | "failed";
type CheckStatus = "up" | "down";

interface HealthCheckResult {
  name: string;
  status: CheckStatus;
  critical: boolean;
  latencyMs: number;
  error?: string;
}

interface ErrorWithCode extends Error {
  code?: string;
}

export interface HealthReport {
  status: HealthState;
  timestamp: string;
  checks: Record<string, HealthCheckResult>;
}

const DEFAULT_TIMEOUT_MS = 3_000;

async function timedCheck(
  name: string,
  critical: boolean,
  check: () => Promise<void>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<HealthCheckResult> {
  const startedAt = Date.now();

  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timed out")), timeoutMs);
      }),
    ]);

    return {
      name,
      status: "up",
      critical,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : error &&
            typeof error === "object" &&
            "code" in error &&
            typeof (error as ErrorWithCode).code === "string" &&
            (error as ErrorWithCode).code!.trim().length > 0
          ? (error as ErrorWithCode).code
          : "Unknown health check error";

    return {
      name,
      status: "down",
      critical,
      latencyMs: Date.now() - startedAt,
      error: message,
    };
  }
}

async function checkDatabase(): Promise<void> {
  await db.execute(sql`select 1`);
}

async function checkS3(): Promise<void> {
  const config = getS3Config();

  await s3Client.send(
    new HeadBucketCommand({
      Bucket: config.bucket,
    })
  );
}

async function checkWebSocket(): Promise<void> {
  const host = process.env.WEBSOCKET_HOST || "localhost";
  const port = parseInt(process.env.WEBSOCKET_PORT || "3001", 10);

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.once("connect", () => {
      cleanup();
      resolve();
    });

    socket.once("error", (error) => {
      cleanup();
      reject(error);
    });

    socket.setTimeout(DEFAULT_TIMEOUT_MS, () => {
      cleanup();
      reject(new Error("Timed out"));
    });
  });
}

export async function getHealthReport(): Promise<HealthReport> {
  const checks = await Promise.all([
    timedCheck("database", true, checkDatabase),
    timedCheck("s3", true, checkS3),
    timedCheck("websocket", false, checkWebSocket),
  ]);

  const checkMap = Object.fromEntries(
    checks.map((check) => [check.name, check])
  );

  const hasCriticalFailure = checks.some(
    (check) => check.critical && check.status === "down"
  );
  const hasAnyFailure = checks.some((check) => check.status === "down");

  return {
    status: hasCriticalFailure ? "failed" : hasAnyFailure ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    checks: checkMap,
  };
}
