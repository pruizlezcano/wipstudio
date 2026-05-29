export async function register() {
  const { ensureBucketExists } = await import("./lib/storage/s3");
  const { migrateDB } = await import("./lib/db/migrate");
  const { backfillMissingWaveformData } =
    await import("./lib/waveform-backfill");

  await migrateDB();
  await ensureBucketExists();
  await backfillMissingWaveformData();
}
