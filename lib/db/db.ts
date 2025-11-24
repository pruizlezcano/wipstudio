import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getDatabaseConfig } from '@/lib/config';

// Lazy initialization of database connection
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const config = getDatabaseConfig();
  dbInstance = drizzle(config.url);
  return dbInstance;
}

// Export the database instance using a Proxy for lazy initialization
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const database = initDb();
    const value = (database as any)[prop];
    return typeof value === "function" ? value.bind(database) : value;
  },
});
