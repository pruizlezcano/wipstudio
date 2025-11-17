export async function register() {
  const { ensureBucketExists } = await import("./lib/storage/s3");
  await ensureBucketExists();
}
