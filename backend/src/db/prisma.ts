import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

type PrismaLogEvent = { message: string };

function createClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["warn", "error"]
  });

  client.$on("warn", (e: PrismaLogEvent) => console.warn("[prisma:warn]", e.message));
  client.$on("error", (e: PrismaLogEvent) => console.error("[prisma:error]", e.message));

  return client;
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

