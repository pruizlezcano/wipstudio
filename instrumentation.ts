export async function register() {
  const { ensureBucketExists } = await import("./lib/storage/s3");
  const { migrateDB } = await import("./lib/db/migrate");

  await migrateDB();
  await ensureBucketExists();
}
