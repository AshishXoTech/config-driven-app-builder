/**
 * Structured logger for production-safe logging.
 */
const isProd = process.env.NODE_ENV === "production";

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    if (!isProd) {
      console.log(`ℹ️ [INFO] ${message}`, meta || "");
    }
  },
  warn: (message: string, meta?: Record<string, any>) => {
    // Warnings are logged in prod but kept minimal
    console.warn(`⚠️ [WARN] ${message}`, isProd ? "" : meta || "");
  },
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    // Always log errors, but sanitize details in prod if needed
    console.error(`❌ [ERROR] ${message}`, isProd ? "" : error || "", isProd ? "" : meta || "");
  },
};
