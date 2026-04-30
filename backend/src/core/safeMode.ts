import { logger } from "../utils/logger";

export const SYSTEM_STATE = {
  safeMode: false,
  errors: [] as string[],
};

/**
 * Triggers safe mode globally.
 */
export function triggerSafeMode(error: string) {
  if (process.env.ENABLE_SAFE_MODE !== "true") {
    logger.warn(`Safe mode is disabled by feature flag. Original error: ${error}`);
    return;
  }

  if (!SYSTEM_STATE.safeMode) {
    logger.warn("🚨 SYSTEM ENTERING SAFE MODE 🚨");
    SYSTEM_STATE.safeMode = true;
  }
  
  if (!SYSTEM_STATE.errors.includes(error)) {
    SYSTEM_STATE.errors.push(error);
    logger.error("Safe mode error registered", error);
  }
}

export function getSystemState() {
  return SYSTEM_STATE;
}
