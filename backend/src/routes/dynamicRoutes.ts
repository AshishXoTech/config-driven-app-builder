import type { Router } from "express";
import type { AppConfig } from "../core/configLoader";
import { generateDynamicRoutes } from "../core/routeGenerator";
import { CrudService } from "../services/crudService";

/**
 * Dynamic CRUD routes generated from app config.
 */
export function dynamicRoutes(config: AppConfig, crud: CrudService): Router {
  return generateDynamicRoutes(config, crud);
}