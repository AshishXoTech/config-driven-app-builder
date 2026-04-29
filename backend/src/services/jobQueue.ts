/**
 * In-Memory Job Queue for CSV Import
 *
 * Trade-off: This uses a simple in-memory Map instead of BullMQ/Kafka.
 * - Pros: Zero infrastructure, works immediately, clean API
 * - Cons: Jobs are lost on server restart, single-instance only
 *
 * In production, this would be replaced with a persistent queue (Redis + BullMQ)
 * and a dedicated worker process. The API contract (jobId, status polling) stays identical.
 */

export interface ImportJob {
  id: string;
  status: "processing" | "done" | "failed";
  successCount: number;
  failedCount: number;
  errors: { row: number; message: string; field?: string }[];
  createdAt: number;
}

const jobs = new Map<string, ImportJob>();

let jobCounter = 0;

export function createJob(): ImportJob {
  jobCounter++;
  const id = `job_${Date.now()}_${jobCounter}`;
  const job: ImportJob = {
    id,
    status: "processing",
    successCount: 0,
    failedCount: 0,
    errors: [],
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ImportJob | undefined {
  return jobs.get(id);
}

/**
 * Cleanup old completed jobs to prevent memory leaks.
 * Runs every 10 minutes, removes jobs older than 1 hour.
 */
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.status !== "processing" && job.createdAt < cutoff) {
      jobs.delete(id);
    }
  }
}, 10 * 60 * 1000);
