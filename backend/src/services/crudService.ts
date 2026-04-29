import type { Prisma, PrismaClient } from "@prisma/client";
import { notificationService } from "./notificationService";

type JsonObject = Prisma.InputJsonObject;
type PrismaModelDelegate = {
  create(args: { data: JsonObject }): Promise<unknown>;
  createMany(args: { data: JsonObject[], skipDuplicates?: boolean }): Promise<{ count: number }>;
  findMany(args: { where?: JsonObject; orderBy?: { id: "asc" | "desc" }; skip?: number; take?: number }): Promise<unknown>;
  findUnique(args: { where: { id: number } }): Promise<unknown>;
  update(args: { where: { id: number }; data: JsonObject }): Promise<unknown>;
  delete(args: { where: { id: number } }): Promise<unknown>;
};

export class CrudService {
  constructor(private readonly prisma: PrismaClient) {}

  private model(modelName: string): PrismaModelDelegate {
    const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const delegate = (this.prisma as unknown as Record<string, PrismaModelDelegate>)[delegateName];
    if (!delegate) {
      const err = new Error(`Unknown Prisma model: ${modelName}`);
      err.name = "BadRequest";
      throw err;
    }
    return delegate;
  }

  /**
   * Helper to execute Prisma calls and catch schema mismatch errors.
   * This is critical for Database Flexibility, ensuring extra UI config fields
   * don't crash the entire API.
   */
  private async safeCall<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err: any) {
      if (err.name === "PrismaClientValidationError") {
        const error = new Error("Database schema mismatch or invalid field provided");
        error.name = "BadRequest";
        throw error;
      }
      throw err;
    }
  }

  /**
   * Create a record, optionally scoped to the authenticated user.
   * Emits a CREATE notification after successful insert.
   */
  async create(modelName: string, data: JsonObject, userId?: number) {
    const payload: JsonObject = userId ? { ...data, userId } : data;
    const result = await this.safeCall(() => this.model(modelName).create({ data: payload }));

    if (userId) {
      const recordId = (result as { id?: number })?.id;
      void notificationService.emit("CREATE", modelName, userId, recordId);
    }

    return result;
  }

  /**
   * Bulk insert records. Not currently scoped to notifications to avoid flooding.
   */
  async createMany(modelName: string, data: JsonObject[], userId?: number) {
    const payload = userId ? data.map(d => ({ ...d, userId })) : data;
    return this.safeCall(() => this.model(modelName).createMany({ data: payload, skipDuplicates: true }));
  }

  /**
   * List all records. When userId is provided, returns only that user's records.
   * Now supports basic pagination.
   */
  async findAll(modelName: string, userId?: number, page: number = 1, limit: number = 50) {
    const where: JsonObject | undefined = userId ? { userId } : undefined;
    const skip = (page - 1) * limit;
    return this.safeCall(() => this.model(modelName).findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }));
  }

  /**
   * Update a record by ID.
   * Emits an UPDATE notification after successful update.
   */
  async update(modelName: string, id: number, data: JsonObject, userId?: number) {
    const result = await this.safeCall(() => this.model(modelName).update({
      where: { id },
      data
    }));

    if (userId) {
      void notificationService.emit("UPDATE", modelName, userId, id);
    }

    return result;
  }

  /**
   * Delete a record by ID.
   * Emits a DELETE notification after successful deletion.
   */
  async delete(modelName: string, id: number, userId?: number) {
    const result = await this.safeCall(() => this.model(modelName).delete({ where: { id } }));

    if (userId) {
      void notificationService.emit("DELETE", modelName, userId, id);
    }

    return result;
  }
}
