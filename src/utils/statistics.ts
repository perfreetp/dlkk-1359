import type { UsageStats, TaskType } from '../types';

interface DailyStat {
  date: string;
  count: number;
  taskType?: TaskType;
  userId?: string;
}

export function getWeeklyStats(stats: (UsageStats | DailyStat)[], userId?: string): (UsageStats | DailyStat)[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return stats.filter(s => {
    const date = new Date(s.date);
    const userMatch = userId ? s.userId === userId : true;
    return date >= weekAgo && date <= now && userMatch;
  });
}

export function aggregateByDate(stats: (UsageStats | DailyStat)[]): Record<string, number> {
  const result: Record<string, number> = {};
  
  for (const s of stats) {
    const date = s.date.split('T')[0];
    result[date] = (result[date] || 0) + s.count;
  }
  
  return result;
}

export function aggregateByType(stats: (UsageStats | DailyStat)[]): Record<TaskType, number> {
  const result: Record<TaskType, number> = {
    product: 0,
    service: 0,
    image: 0,
  };
  
  for (const s of stats) {
    if (s.taskType) {
      result[s.taskType] += s.count;
    }
  }
  
  return result;
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(date.toISOString().split('T')[0]);
  }
  
  return days;
}

export function getWeekDayName(dateStr: string): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

export function generateMockWeeklyStats(userId: string): UsageStats[] {
  const stats: UsageStats[] = [];
  const taskTypes: TaskType[] = ['product', 'service', 'image'];
  const days = getLast7Days();
  
  for (const day of days) {
    for (const type of taskTypes) {
      const count = Math.floor(Math.random() * 15) + 3;
      stats.push({
        date: day,
        taskType: type,
        count,
        userId,
      });
    }
  }
  
  return stats;
}

export function getHeatmapIntensity(count: number, maxCount: number): number {
  if (maxCount === 0) return 0;
  return Math.min(1, count / maxCount);
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}
