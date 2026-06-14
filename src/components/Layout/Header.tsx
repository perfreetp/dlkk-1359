import React from 'react';
import { Bell, Search, Settings, Zap } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useTaskStore } from '../../store/useTaskStore';
import { aggregateByDate, getLast7Days } from '../../utils/statistics';
import { Badge } from '../ui/Badge';

export const Header: React.FC = () => {
  const { currentUser } = useUserStore();
  const { usageStats, tasks } = useTaskStore();
  
  const dailyStats = aggregateByDate(usageStats);
  const days = getLast7Days();
  const weekTotal = days.reduce((sum, day) => sum + (dailyStats[day] || 0), 0);
  
  const pendingDanger = tasks.filter(t => 
    t.outputs.some(o => o.sensitiveWords.some(s => s.level === 'danger'))
  ).length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索历史任务..."
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-800">
            本周已使用 <span className="font-bold">{weekTotal}</span> 次
          </span>
        </div>

        <div className="relative">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {pendingDanger > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {pendingDanger}
              </span>
            )}
          </button>
        </div>

        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
            <p className="text-xs text-gray-500">
              {currentUser?.role === 'manager' ? (
                <Badge variant="amber" size="sm" dot>主管</Badge>
              ) : (
                <Badge variant="info" size="sm" dot>运营</Badge>
              )}
            </p>
          </div>
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full border-2 border-gray-200"
          />
        </div>
      </div>
    </header>
  );
};
