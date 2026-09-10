import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __dbClient: DbClient | undefined;
}

function createClient(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment (and to turbo.json's build env for CI/Vercel builds)."
    );
  }
  const client = drizzle(neon(url), { schema });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__dbClient = client;
  }
  return client;
}

/**
 * Lazily created on first use. Importing this module never touches
 * DATABASE_URL, so `next build`'s route analysis works without it — the
 * connection string is only required when a query actually runs.
 */
export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, prop) {
    const client = globalThis.__dbClient ?? createClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
