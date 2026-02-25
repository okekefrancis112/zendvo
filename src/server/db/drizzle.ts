import { prisma } from "@/lib/prisma";
import { drizzle, type AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

const sqliteProxyCallback: AsyncRemoteCallback = async (
  sql,
  params,
  method,
) => {
  if (method === "run") {
    await prisma.$executeRawUnsafe(sql, ...params);
    return { rows: [] };
  }

  const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as unknown[];
  return { rows };
};

const createDb = () => drizzle(sqliteProxyCallback, { schema });
type DrizzleDb = ReturnType<typeof createDb>;

const globalForDrizzle = globalThis as unknown as {
  drizzleDb?: DrizzleDb;
};

export const db = globalForDrizzle.drizzleDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDrizzle.drizzleDb = db;
}
