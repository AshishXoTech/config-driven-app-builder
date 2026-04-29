import { prisma } from "../db/prisma";

/**
 * CRUD event types that trigger notifications.
 */
export type CrudEvent = "CREATE" | "UPDATE" | "DELETE";

/**
 * Notification service — event-based system that:
 * 1. Logs the event to console
 * 2. Stores a notification in the DB
 * 3. Sends a mock email via console.log
 *
 * Designed to be called from CrudService after each operation,
 * keeping notification logic in one place (no duplication).
 */
export class NotificationService {
  /**
   * Emit a notification for a CRUD event.
   *
   * @param event   - CREATE, UPDATE, or DELETE
   * @param model   - The Prisma model name (e.g. "User", "Task")
   * @param userId  - The authenticated user who performed the action
   * @param recordId - The ID of the affected record (optional for create)
   */
  async emit(
    event: CrudEvent,
    model: string,
    userId: number,
    recordId?: number | string
  ): Promise<void> {
    const message = this.buildMessage(event, model, recordId);

    // 1. Console log
    console.log(`📣 [NOTIFICATION] ${message} (userId: ${userId})`);

    // 2. Persist to DB (Decoupled & Non-blocking)
    prisma.notification.create({
      data: { message, userId },
    }).catch((err) => {
      // Non-blocking — don't let notification failures break CRUD
      console.error("⚠️ Failed to persist notification (background):", err);
    });

    // 3. Mock email sender
    this.sendMockEmail(userId, message);
  }

  /**
   * Fetch all notifications for a given user, most recent first.
   */
  async getByUserId(userId: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Build a human-readable notification message.
   */
  private buildMessage(event: CrudEvent, model: string, recordId?: number | string): string {
    const action = event.toLowerCase();  // "created", "updated", "deleted"
    const suffix = recordId != null ? ` #${recordId}` : "";

    // e.g. "User created", "Task #5 deleted", "User #3 updated"
    return `${model}${suffix} ${action}d`;
  }

  /**
   * Mock email sender — logs to console instead of sending real emails.
   * In production, replace this with an actual email/SMTP call.
   */
  private sendMockEmail(userId: number, message: string): void {
    console.log(`📧 [MOCK EMAIL] To userId ${userId}: ${message}`);
  }
}

/**
 * Singleton instance — import this wherever needed.
 */
export const notificationService = new NotificationService();
