import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./db";

export async function migrateDB(): Promise<void> {
  try {
    console.log("Running database migrations...");

    await migrate(db, { migrationsFolder: "drizzle" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error running migrations:", error.message || error);
    throw error;
  }
}
