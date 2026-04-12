import type {
  ReportLoadRow,
  ReportPeriod,
  ReportTaskItem,
  ReportTimelinePoint,
} from "./types";

function formatBucketDate(date: Date, period: ReportPeriod): string {
  if (period === "day") {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (period === "week" || period === "month") {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function getTimelineBucketCount(period: ReportPeriod): number {
  if (period === "day") return 6;
  if (period === "week") return 7;
  if (period === "month") return 6;
  return 6;
}

function getTimelineBucketSizeMs(period: ReportPeriod): number {
  if (period === "day") return 4 * 60 * 60 * 1000;
  if (period === "week") return 24 * 60 * 60 * 1000;
  if (period === "month") return 5 * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
}

export function formatDurationLong(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "0 с";
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (!minutes) {
    return `${totalSeconds} с`;
  }

  return `${minutes} мин ${seconds} с`;
}

export function formatDurationCompact(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) {
    return "—";
  }

  if (durationMs >= 60_000) {
    return `${(durationMs / 60_000).toFixed(1)} мин`;
  }

  if (durationMs >= 1_000) {
    return `${(durationMs / 1_000).toFixed(1)} с`;
  }

  return `${Math.round(durationMs)} мс`;
}

export function getReportTemplateIcon(templateTitle: string): string {
  return templateTitle.trim().toLowerCase() === "db-sync"
    ? "/sync.png"
    : "/zadachi.png";
}

export function buildTimelineSeries(
  tasks: ReportTaskItem[],
  period: ReportPeriod,
  now = new Date(),
): ReportTimelinePoint[] {
  const bucketCount = getTimelineBucketCount(period);
  const bucketSizeMs = getTimelineBucketSizeMs(period);
  const lastBucketEnd = now.getTime();

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = lastBucketEnd - bucketSizeMs * (bucketCount - index);
    const bucketEnd = bucketStart + bucketSizeMs;
    const labelDate = new Date(bucketEnd);
    return {
      id: `${period}-${index}`,
      startMs: bucketStart,
      endMs: bucketEnd,
      label: formatBucketDate(labelDate, period),
      totalTasks: 0,
      successCount: 0,
      errorCount: 0,
    };
  });

  for (const task of tasks) {
    const createdAtMs = new Date(task.createdAtIso).getTime();
    if (Number.isNaN(createdAtMs)) {
      continue;
    }

    const bucket = buckets.find(
      (item) => createdAtMs >= item.startMs && createdAtMs < item.endMs,
    );
    if (!bucket) {
      continue;
    }

    bucket.totalTasks += 1;
    if (task.status === "completed") {
      bucket.successCount += 1;
    }
    if (task.status === "error") {
      bucket.errorCount += 1;
    }
  }

  return buckets.map(({ id, label, totalTasks, successCount, errorCount }) => ({
    id,
    label,
    totalTasks,
    successCount,
    errorCount,
  }));
}

export function buildTopMachineRows(tasks: ReportTaskItem[]): ReportLoadRow[] {
  const grouped = new Map<
    string,
    { label: string; totalTasks: number; successCount: number }
  >();

  for (const task of tasks) {
    const bucket = grouped.get(task.machineId) ?? {
      label: task.machine,
      totalTasks: 0,
      successCount: 0,
    };
    bucket.totalTasks += 1;
    if (task.status === "completed") {
      bucket.successCount += 1;
    }
    grouped.set(task.machineId, bucket);
  }

  return [...grouped.entries()]
    .map(([id, bucket]) => ({
      id,
      label: bucket.label,
      totalTasks: bucket.totalTasks,
      successRate: bucket.totalTasks
        ? Math.round((bucket.successCount / bucket.totalTasks) * 100)
        : 0,
    }))
    .sort((left, right) => right.totalTasks - left.totalTasks)
    .slice(0, 5);
}
