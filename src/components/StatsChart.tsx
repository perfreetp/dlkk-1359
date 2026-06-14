import React from 'react';
import type { UsageStats, TaskType } from '../types';
import { aggregateByDate, aggregateByType, getLast7Days, getWeekDayName, formatNumber, getHeatmapIntensity } from '../utils/statistics';
import { BarChart3, TrendingUp, FileText, MessageSquare, Image } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { cn } from '../lib/utils';

interface DailyStat {
  date: string;
  count: number;
  taskType?: TaskType;
  userId?: string;
}

interface WeeklyBarChartProps {
  stats: (UsageStats | DailyStat)[];
  className?: string;
  compact?: boolean;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ stats, className, compact = false }) => {
  const dailyStats = aggregateByDate(stats);
  const days = getLast7Days();
  const maxCount = Math.max(...Object.values(dailyStats), 1);

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-end justify-between gap-1 h-24">
          {days.map((day) => {
            const count = dailyStats[day] || 0;
            const height = (count / maxCount) * 100;
            const isToday = day === new Date().toISOString().split('T')[0];
            
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-16">
                  <div
                    className={cn(
                      'w-full max-w-[24px] rounded-t transition-all duration-500',
                      isToday ? 'bg-gradient-to-t from-blue-700 to-blue-500' : 'bg-gradient-to-t from-blue-200 to-blue-100'
                    )}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
                <span className={cn(
                  'text-[10px]',
                  isToday ? 'text-blue-700 font-medium' : 'text-gray-500'
                )}>
                  {getWeekDayName(day).charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            本周使用次数
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">最近7天使用趋势</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(Object.values(dailyStats).reduce((a, b) => a + b, 0))}
          </p>
          <p className="text-xs text-green-600 flex items-center justify-end gap-1">
            <TrendingUp className="w-3 h-3" />
            +12.5%
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-end justify-between gap-1 h-32">
          {days.map((day) => {
            const count = dailyStats[day] || 0;
            const height = (count / maxCount) * 100;
            const isToday = day === new Date().toISOString().split('T')[0];
            
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  <span className="text-xs text-gray-600 font-medium mb-1">
                    {count}
                  </span>
                  <div
                    className={cn(
                      'w-full max-w-[32px] rounded-t transition-all duration-500',
                      isToday ? 'bg-gradient-to-t from-blue-700 to-blue-500' : 'bg-gradient-to-t from-blue-200 to-blue-100'
                    )}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
                <span className={cn(
                  'text-xs',
                  isToday ? 'text-blue-700 font-medium' : 'text-gray-500'
                )}>
                  {getWeekDayName(day)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface TypeDistributionProps {
  stats: (UsageStats | DailyStat)[];
  className?: string;
}

export const TypeDistribution: React.FC<TypeDistributionProps> = ({ stats, className }) => {
  const byType = aggregateByType(stats);
  const total = Object.values(byType).reduce((a, b) => a + b, 0);

  const typeConfig: Record<TaskType, { label: string; icon: React.ReactNode; color: string }> = {
    product: { label: '商品文案', icon: <FileText className="w-4 h-4" />, color: 'bg-blue-500' },
    service: { label: '客服话术', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-green-500' },
    image: { label: '图片处理', icon: <Image className="w-4 h-4" />, color: 'bg-purple-500' },
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold text-gray-900">功能使用分布</h3>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {(Object.keys(byType) as TaskType[]).map((type) => {
          const config = typeConfig[type];
          const percentage = total > 0 ? Math.round((byType[type] / total) * 100) : 0;
          
          return (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  {config.icon}
                  {config.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{byType[type]}</span>
                  <span className="text-xs text-gray-500">({percentage}%)</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', config.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

interface HeatmapCalendarProps {
  stats: (UsageStats | DailyStat)[];
  className?: string;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ stats, className }) => {
  const dailyStats = aggregateByDate(stats);
  const days = getLast7Days();
  const maxCount = Math.max(...Object.values(dailyStats), 1);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold text-gray-900">使用热力图</h3>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const count = dailyStats[day] || 0;
            const intensity = getHeatmapIntensity(count, maxCount);
            
            let bgColor = 'bg-gray-100';
            if (intensity > 0.75) bgColor = 'bg-blue-600';
            else if (intensity > 0.5) bgColor = 'bg-blue-400';
            else if (intensity > 0.25) bgColor = 'bg-blue-300';
            else if (intensity > 0) bgColor = 'bg-blue-200';
            
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <div
                  className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300', bgColor,
                    intensity > 0.5 ? 'text-white' : 'text-gray-600'
                  )}
                >
                  {count}
                </div>
                <span className="text-xs text-gray-500">{getWeekDayName(day).slice(1)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
