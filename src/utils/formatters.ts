export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

export function formatTime(date: Date | null): string {
  if (!date) return '--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '--';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInfusionDuration(startTime: Date | null): string {
  if (!startTime) return '--';
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return formatDuration(diffMins);
}

export function getDisinfectionRemaining(startTime: Date | null, duration: number): string {
  if (!startTime) return '--';
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const elapsedMins = Math.floor(diffMs / (1000 * 60));
  const remaining = Math.max(0, duration - elapsedMins);
  return `${remaining}分钟`;
}

export function getDisinfectionProgress(startTime: Date | null, duration: number): number {
  if (!startTime) return 0;
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const elapsedMins = diffMs / (1000 * 60);
  return Math.min(100, (elapsedMins / duration) * 100);
}
