import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { trackVersion } from "@/lib/db/schema";
import {
  extractWaveformCacheFromS3Object,
  serializeWaveformPeaks,
} from "@/lib/waveform-peaks";

const WAVEFORM_BACKFILL_LOCK_ID = 410021001;
const DEFAULT_BATCH_SIZE = 25;

export async function backfillMissingWaveformData(options?: {
  batchSize?: number;
  versionId?: string;
}) {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  console.log("Starting waveform backfill...");
  const lockResult = await db.execute<{ locked: boolean }>(
    sql`SELECT pg_try_advisory_lock(${WAVEFORM_BACKFILL_LOCK_ID}) AS locked`
  );
  const hasLock = lockResult.rows[0]?.locked === true;

  if (!hasLock) {
    console.log(
      "Skipping waveform backfill because another instance already holds the advisory lock."
    );
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  try {
    while (true) {
      const versions = await db
        .select({
          id: trackVersion.id,
          audioUrl: trackVersion.audioUrl,
        })
        .from(trackVersion)
        .where(
          and(
            or(
              isNull(trackVersion.waveformPeaks),
              isNull(trackVersion.audioDuration)
            ),
            options?.versionId
              ? eq(trackVersion.id, options.versionId)
              : sql`true`
          )
        )
        .orderBy(asc(trackVersion.createdAt))
        .limit(batchSize);

      if (versions.length === 0) {
        break;
      }

      for (const version of versions) {
        try {
          const waveformCache = await extractWaveformCacheFromS3Object(
            version.audioUrl
          );
          const serializedPeaks = serializeWaveformPeaks(waveformCache?.peaks);

          if (!serializedPeaks || !waveformCache?.duration) {
            skipped += 1;
            console.warn(
              `Skipped ${version.id}: no waveform peaks or duration were generated.`
            );
            continue;
          }

          await db
            .update(trackVersion)
            .set({
              waveformPeaks: serializedPeaks,
              audioDuration: waveformCache.duration,
            })
            .where(
              and(
                eq(trackVersion.id, version.id),
                or(
                  isNull(trackVersion.waveformPeaks),
                  isNull(trackVersion.audioDuration)
                )
              )
            );

          success += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed to backfill ${version.id}:`, error);
        }
      }

      if (options?.versionId) {
        break;
      }
    }

    console.log(
      `Waveform backfill finished. success=${success} skipped=${skipped} failed=${failed}`
    );

    if (failed > 0) {
      throw new Error("Waveform backfill completed with failures");
    }
  } finally {
    await db.execute(
      sql`SELECT pg_advisory_unlock(${WAVEFORM_BACKFILL_LOCK_ID})`
    );
  }
}
