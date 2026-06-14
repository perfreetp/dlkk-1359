import React, { useState, useMemo } from 'react';
import { 
  Users, 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Clock,
  X,
  CheckCircle2,
  ListFilter,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  CalendarRange
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../components/ui/Tab';
import { Badge } from '../components/ui/Badge';
import { Select, SelectOption } from '../components/ui/Select';
import { WeeklyBarChart, TypeDistribution, HeatmapCalendar } from '../components/StatsChart';
import { useTaskStore } from '../store/useTaskStore';
import { mockTeamMembers } from '../mock/users';
import { downloadCSV, formatDate, formatDateTime, getTaskTypeLabel } from '../utils/formatters';
import { Task, TeamMember, TaskType, UsageStats } from '../types';
import { cn } from '../lib/utils';

interface MemberComputedStats {
  member: TeamMember;
  totalTasks: number;
  periodUsage: number;
  periodStats: UsageStats[];
  markedTasks: number;
  completedTasks: number;
  warningTasks: number;
  recentTasks: Task[];
  taskDistribution: Record<TaskType, number>;
  avgConversionRate: number;
  hasWarning: boolean;
  lastActive: string;
  lastWeekTasks: number;
  weeklyChange: number;
}

interface Filters {
  memberId: string;
  taskType: string;
  dateFrom: string;
  dateTo: string;
  preset: string;
}

type DateRange = { from: Date; to: Date };

const dateToStr = (d: Date) => d.toISOString().split('T')[0];

const getPresetRange = (preset: string): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'thisWeek': {
      const day = today.getDay() || 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - (day - 1));
      return { from: monday, to: today };
    }
    case 'lastWeek': {
      const day = today.getDay() || 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - (day - 1));
      const lastMonday = new Date(monday);
      lastMonday.setDate(monday.getDate() - 7);
      const lastSunday = new Date(monday);
      lastSunday.setDate(monday.getDate() - 1);
      return { from: lastMonday, to: lastSunday };
    }
    case '7days': {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      return { from, to: today };
    }
    case '30days': {
      const from = new Date(today);
      from.setDate(today.getDate() - 29);
      return { from, to: today };
    }
    default:
      return { from: new Date(today), to: new Date(today) };
  }
};

const presets: { value: string; label: string }[] = [
  { value: '7days', label: '近7天' },
  { value: 'thisWeek', label: '本周' },
  { value: 'lastWeek', label: '上周' },
  { value: '30days', label: '近30天' },
  { value: 'custom', label: '自定义' },
];

const calcConversionRate = (marked: number, total: number): number => {
  if (total === 0) return 0;
  const rate = (marked / total) * 100;
  return Math.round(rate * 10) / 10;
};

const calcWeekTasks = (userId: string, tasks: Task[], offsetWeek: number = 0): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day - 1));
  const weekStart = new Date(monday);
  weekStart.setDate(monday.getDate() - offsetWeek * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  weekStart.setHours(0, 0, 0, 0);

  return tasks.filter(t => {
    if (t.userId !== userId) return false;
    const dt = new Date(t.createdAt);
    return dt >= weekStart && dt <= weekEnd;
  }).length;
};

const calcPeriodTasks = (userId: string, tasks: Task[], from: Date, to: Date): Task[] => {
  const f = new Date(from); f.setHours(0, 0, 0, 0);
  const t = new Date(to); t.setHours(23, 59, 59, 999);
  return tasks.filter(task => {
    if (task.userId !== userId) return false;
    const dt = new Date(task.createdAt);
    return dt >= f && dt <= t;
  });
};

const TeamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const [filters, setFilters] = useState<Filters>(() => {
    const range = getPresetRange('7days');
    return {
      memberId: 'all',
      taskType: 'all',
      dateFrom: dateToStr(range.from),
      dateTo: dateToStr(range.to),
      preset: '7days',
    };
  });

  const { getTeamTasks } = useTaskStore();
  const allTasks = useMemo(() => getTeamTasks(), [getTeamTasks]);

  const fromDate = useMemo(() => new Date(filters.dateFrom), [filters.dateFrom]);
  const toDate = useMemo(() => new Date(filters.dateTo), [filters.dateTo]);

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setFilters(f => ({ ...f, preset }));
      return;
    }
    const range = getPresetRange(preset);
    setFilters(f => ({
      ...f,
      preset,
      dateFrom: dateToStr(range.from),
      dateTo: dateToStr(range.to),
    }));
  };

  const filteredTasks = useMemo(() => {
    const f = new Date(filters.dateFrom); f.setHours(0, 0, 0, 0);
    const t = new Date(filters.dateTo); t.setHours(23, 59, 59, 999);
    return allTasks.filter(task => {
      if (filters.memberId !== 'all' && task.userId !== filters.memberId) return false;
      if (filters.taskType !== 'all' && task.type !== filters.taskType) return false;
      const dt = new Date(task.createdAt);
      if (dt < f || dt > t) return false;
      return true;
    });
  }, [allTasks, filters]);

  const memberOptions: SelectOption[] = [
    { value: 'all', label: '全部成员（团队视角）' },
    ...mockTeamMembers.map(m => ({ value: m.userId, label: `${m.name} 工作台` })),
  ];

  const typeOptions: SelectOption[] = [
    { value: 'all', label: '全部类型' },
    { value: 'product', label: '商品文案' },
    { value: 'service', label: '客服话术' },
    { value: 'image', label: '图片处理' },
  ];

  const getPeriodStats = (tasks: Task[]) => {
    const days: Record<string, number> = {};
    const f = new Date(filters.dateFrom);
    const t = new Date(filters.dateTo);
    const cursor = new Date(f);
    while (cursor <= t) {
      days[dateToStr(cursor)] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }
    tasks.forEach(task => {
      const key = dateToStr(new Date(task.createdAt));
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date,
      count,
      taskType: 'product' as TaskType,
      userId: 'filtered',
    }));
  };

  const getTaskDistribution = (tasks: Task[]): Record<TaskType, number> => {
    const dist: Record<TaskType, number> = { product: 0, service: 0, image: 0 };
    tasks.forEach(t => dist[t.type]++);
    return dist;
  };

  const getLastActive = (tasks: Task[]): string => {
    if (tasks.length === 0) return '暂无活动';
    const latest = tasks.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
    return formatDate(latest.createdAt);
  };

  const memberStatsMap = useMemo(() => {
    const map: Record<string, MemberComputedStats> = {};
    mockTeamMembers.forEach(member => {
      const userId = member.userId;
      const memberPeriodTasks = calcPeriodTasks(userId, filteredTasks, fromDate, toDate);
      const periodStats = getPeriodStats(memberPeriodTasks);
      const taskDistribution = getTaskDistribution(memberPeriodTasks);
      const periodUsage = periodStats.reduce((sum, s) => sum + s.count, 0);
      const markedTasks = memberPeriodTasks.filter(t => t.status === 'marked').length;
      const completedTasks = memberPeriodTasks.filter(t => t.status === 'completed').length;
      const warningTasks = memberPeriodTasks.filter(t => 
        t.outputs.some(o => o.sensitiveWords.some(s => s.level === 'danger'))
      ).length;
      const hasWarning = warningTasks > 0;
      const avgConversionRate = calcConversionRate(markedTasks, memberPeriodTasks.length);
      const lastActive = getLastActive(memberPeriodTasks);
      const recentTasks = [...memberPeriodTasks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      const thisWeekTasks = calcWeekTasks(userId, allTasks, 0);
      const lastWeekTasks = calcWeekTasks(userId, allTasks, 1);
      const weeklyChange = lastWeekTasks === 0 
        ? (thisWeekTasks > 0 ? 100 : 0)
        : Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100);

      map[userId] = {
        member,
        totalTasks: memberPeriodTasks.length,
        periodUsage,
        periodStats,
        markedTasks,
        completedTasks,
        warningTasks,
        recentTasks,
        taskDistribution,
        avgConversionRate,
        hasWarning,
        lastActive,
        lastWeekTasks,
        weeklyChange,
      };
    });
    return map;
  }, [filteredTasks, filters.dateFrom, filters.dateTo]);

  const teamStats = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const totalUsage = Object.values(memberStatsMap).reduce((sum, m) => sum + m.periodUsage, 0);
    const activeMembers = Object.values(memberStatsMap).filter(m => m.totalTasks > 0).length;
    const avgConversion = activeMembers > 0
      ? Math.round(
          (Object.values(memberStatsMap).reduce((sum, m) => sum + m.avgConversionRate, 0) / activeMembers) * 10
        ) / 10
      : 0;
    const hasWarning = Object.values(memberStatsMap).some(m => m.hasWarning);
    const totalMarked = Object.values(memberStatsMap).reduce((sum, m) => sum + m.markedTasks, 0);
    const totalWarning = Object.values(memberStatsMap).reduce((sum, m) => sum + m.warningTasks, 0);
    const thisWeekAll = mockTeamMembers.reduce((s, m) => s + calcWeekTasks(m.userId, allTasks, 0), 0);
    const lastWeekAll = mockTeamMembers.reduce((s, m) => s + calcWeekTasks(m.userId, allTasks, 1), 0);
    const weeklyChangeAll = lastWeekAll === 0 
      ? (thisWeekAll > 0 ? 100 : 0)
      : Math.round(((thisWeekAll - lastWeekAll) / lastWeekAll) * 100);
    
    return { totalTasks, totalUsage, avgConversion, hasWarning, totalMarked, activeMembers, totalWarning, weeklyChangeAll, thisWeekAll, lastWeekAll };
  }, [filteredTasks, memberStatsMap, allTasks]);

  const teamTaskDistribution = useMemo(() => getTaskDistribution(filteredTasks), [filteredTasks]);

  const sortedMembersByUsage = useMemo(() => 
    [...mockTeamMembers].sort((a, b) => 
      memberStatsMap[b.userId]?.periodUsage - memberStatsMap[a.userId]?.periodUsage
    ),
  [memberStatsMap]);

  const teamPeriodStats = useMemo(() => getPeriodStats(filteredTasks), [filteredTasks, filters.dateFrom, filters.dateTo]);

  const dailyMatrix = useMemo(() => {
    const days: Array<{
      dateKey: string;
      dateLabel: string;
      dayLabel: string;
      tasks: Record<string, { total: number; byType: Record<TaskType, number>; tasks: Task[] }>;
    }> = [];

    const f = new Date(filters.dateFrom);
    const t = new Date(filters.dateTo);
    const cursor = new Date(f);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    while (cursor <= t) {
      const dateKey = dateToStr(cursor);
      const tasksByMember: Record<string, { total: number; byType: Record<TaskType, number>; tasks: Task[] }> = {};
      
      mockTeamMembers.forEach(m => {
        tasksByMember[m.userId] = { total: 0, byType: { product: 0, service: 0, image: 0 }, tasks: [] };
      });

      filteredTasks.forEach(task => {
        const taskDateKey = dateToStr(new Date(task.createdAt));
        if (taskDateKey === dateKey) {
          const entry = tasksByMember[task.userId];
          if (entry) {
            entry.total++;
            entry.byType[task.type]++;
            entry.tasks.push(task);
          }
        }
      });

      days.push({
        dateKey,
        dateLabel: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
        dayLabel: weekDays[cursor.getDay()],
        tasks: tasksByMember,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [filteredTasks, filters.dateFrom, filters.dateTo]);

  const weekComparison = useMemo(() => {
    return mockTeamMembers.map(member => {
      const uid = member.userId;
      const thisWeekTasks = calcWeekTasks(uid, allTasks, 0);
      const lastWeekTasks = calcWeekTasks(uid, allTasks, 1);
      const weekChange = lastWeekTasks === 0 
        ? (thisWeekTasks > 0 ? 100 : 0)
        : Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100);
      
      const thisWeekByType: Record<TaskType, number> = { product: 0, service: 0, image: 0 };
      const lastWeekByType: Record<TaskType, number> = { product: 0, service: 0, image: 0 };
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const day = today.getDay() || 7;
      const monday = new Date(today); monday.setDate(today.getDate() - (day - 1));
      const weekStart1 = new Date(monday); weekStart1.setHours(0, 0, 0, 0);
      const weekEnd1 = new Date(monday); weekEnd1.setDate(monday.getDate() + 6); weekEnd1.setHours(23, 59, 59, 999);
      const weekStart2 = new Date(monday); weekStart2.setDate(monday.getDate() - 7); weekStart2.setHours(0, 0, 0, 0);
      const weekEnd2 = new Date(monday); weekEnd2.setDate(monday.getDate() - 1); weekEnd2.setHours(23, 59, 59, 999);
      
      allTasks.forEach(task => {
        if (task.userId !== uid) return;
        const dt = new Date(task.createdAt);
        if (dt >= weekStart1 && dt <= weekEnd1) thisWeekByType[task.type]++;
        if (dt >= weekStart2 && dt <= weekEnd2) lastWeekByType[task.type]++;
      });

      const typeChanges = (['product', 'service', 'image'] as TaskType[]).map(type => {
        const tw = thisWeekByType[type];
        const lw = lastWeekByType[type];
        const change = lw === 0 ? (tw > 0 ? 100 : 0) : Math.round(((tw - lw) / lw) * 100);
        return { type, thisWeek: tw, lastWeek: lw, change };
      });

      return {
        member,
        thisWeekTasks,
        lastWeekTasks,
        weekChange,
        thisWeekByType,
        lastWeekByType,
        typeChanges,
      };
    });
  }, [allTasks]);

  const warningTasksList = useMemo(() => {
    return allTasks
      .filter(t => t.outputs.some(o => o.sensitiveWords.some(s => s.level === 'danger')))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(task => {
        const member = mockTeamMembers.find(m => m.userId === task.userId);
        const dangerCount = task.outputs.reduce((sum, o) => 
          sum + o.sensitiveWords.filter(s => s.level === 'danger').length, 0
        );
        return { task, member, dangerCount };
      });
  }, [allTasks]);

  const selectedDayDetail = useMemo(() => {
    if (!selectedDayKey) return null;
    return dailyMatrix.find(d => d.dateKey === selectedDayKey) || null;
  }, [selectedDayKey, dailyMatrix]);

  const handleResetFilters = () => {
    const range = getPresetRange('7days');
    setFilters({
      memberId: 'all',
      taskType: 'all',
      dateFrom: dateToStr(range.from),
      dateTo: dateToStr(range.to),
      preset: '7days',
    });
    setExpandedMember(null);
  };

  const hasActiveFilters = filters.memberId !== 'all' || filters.taskType !== 'all' || filters.preset !== '7days';

  const selectedMember = useMemo(() => {
    if (filters.memberId === 'all') return null;
    return mockTeamMembers.find(m => m.userId === filters.memberId) || null;
  }, [filters.memberId]);

  const displayMembers = useMemo(() => {
    if (filters.memberId === 'all') return sortedMembersByUsage;
    const member = mockTeamMembers.find(m => m.userId === filters.memberId);
    return member ? [member] : [];
  }, [sortedMembersByUsage, filters.memberId]);

  const handleExportOverview = () => {
    const rows = sortedMembersByUsage.map(member => {
      const stats = memberStatsMap[member.userId];
      return {
        姓名: member.name,
        角色: member.role === 'manager' ? '主管' : '运营',
        时间范围: `${filters.dateFrom || '不限'} 至 ${filters.dateTo || '不限'}`,
        快捷范围: presets.find(p => p.value === filters.preset)?.label ?? '自定义',
        成员过滤: filters.memberId === 'all' ? '全部' : member.name,
        类型过滤: filters.taskType === 'all' ? '全部' : getTaskTypeLabel(filters.taskType),
        期间内使用次数: stats?.periodUsage ?? 0,
        本周任务数: stats?.totalTasks ?? 0,
        本周vs上周: `${stats?.weeklyChange ?? 0}%`,
        标记率: `${stats?.avgConversionRate ?? 0}%`,
        已标记: stats?.markedTasks ?? 0,
        已完成: stats?.completedTasks ?? 0,
        有风险: stats?.warningTasks ?? 0,
        商品文案: stats?.taskDistribution.product ?? 0,
        客服话术: stats?.taskDistribution.service ?? 0,
        图片处理: stats?.taskDistribution.image ?? 0,
        最近活跃: stats?.lastActive ?? '暂无',
        加入时间: member.joinDate,
      };
    });
    
    downloadCSV(rows, `团队概览_${filters.dateFrom}_${filters.dateTo}`);
  };

  const handleExportDetails = () => {
    const rows = filteredTasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(task => {
        const member = mockTeamMembers.find(m => m.userId === task.userId);
        return {
          任务ID: task.id,
          创建人: member?.name ?? task.userId,
          角色: member?.role === 'manager' ? '主管' : '运营',
          任务名称: task.title,
          大类: getTaskTypeLabel(task.type),
          细类: getTaskTypeLabel(task.subType),
          状态: task.status === 'marked' ? '已标记' : task.status === 'warning' ? '有风险' : '已完成',
          版本数: task.outputs.length,
          已标记版本: task.outputs.filter(o => o.isMarked).length,
          敏感词数: task.outputs.reduce((sum, o) => sum + o.sensitiveWords.length, 0),
          创建时间: formatDateTime(task.createdAt),
          类目: task.category || '-',
          时间范围: `${filters.dateFrom}_${filters.dateTo}`,
        };
      });
    
    downloadCSV(rows, `任务明细_${filters.dateFrom}_${filters.dateTo}`);
  };

  const handleExportMemberTasks = (userId: string, memberName: string) => {
    const memberTasks = filteredTasks
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const rows = memberTasks.map(task => ({
      任务名称: task.title,
      大类: getTaskTypeLabel(task.type),
      细类: getTaskTypeLabel(task.subType),
      状态: task.status === 'marked' ? '已标记' : task.status === 'warning' ? '有风险' : '已完成',
      版本数: task.outputs.length,
      创建时间: formatDateTime(task.createdAt),
      类目: task.category || '-',
    }));
    
    downloadCSV(rows, `${memberName}_任务明细_${filters.dateFrom}_${filters.dateTo}`);
  };

  const handleExportWeekCompare = () => {
    const rows = weekComparison.map(w => ({
      姓名: w.member.name,
      角色: w.member.role === 'manager' ? '主管' : '运营',
      本周任务: w.thisWeekTasks,
      上周任务: w.lastWeekTasks,
      环比变化: `${w.weekChange}%`,
      本周商品文案: w.thisWeekByType.product,
      上周商品文案: w.lastWeekByType.product,
      本周客服话术: w.thisWeekByType.service,
      上周客服话术: w.lastWeekByType.service,
      本周图片处理: w.thisWeekByType.image,
      上周图片处理: w.lastWeekByType.image,
    }));
    
    downloadCSV(rows, `周对比报表_${new Date().toLocaleDateString()}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-600" />
            {selectedMember ? (
              <>
                {selectedMember.name} 的工作台
                <Badge variant={selectedMember.role === 'manager' ? 'amber' : 'default'} size="sm">
                  {selectedMember.role === 'manager' ? '主管' : '运营'}
                </Badge>
              </>
            ) : (
              '团队管理'
            )}
          </h1>
          <p className="text-gray-500 mt-1">
            {selectedMember 
              ? `查看 ${selectedMember.name} 在当前时间范围内的使用情况` 
              : '查看团队成员使用情况，导出统计报表'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportOverview}>
            <Download className="w-4 h-4" />
            导出概览
          </Button>
          <Button variant="primary" onClick={handleExportDetails}>
            <FileText className="w-4 h-4" />
            导出明细
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <ListFilter className="w-4 h-4" />
              筛选条件
              {hasActiveFilters && (
                <Badge variant="default" size="sm">
                  已筛选 {filteredTasks.length} 条
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="w-3.5 h-3.5" />
              重置
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Select
              label="视角切换"
              value={filters.memberId}
              onChange={(e) => {
                setFilters(f => ({ ...f, memberId: e.target.value }));
                setExpandedMember(null);
              }}
              options={memberOptions}
            />
            <Select
              label="功能类型"
              value={filters.taskType}
              onChange={(e) => setFilters(f => ({ ...f, taskType: e.target.value }))}
              options={typeOptions}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">开始日期</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value, preset: 'custom' }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">结束日期</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value, preset: 'custom' }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <CalendarRange className="w-4 h-4 text-gray-400" />
            {presets.map(p => (
              <button
                key={p.value}
                onClick={() => handlePresetChange(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  filters.preset === p.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {p.label}
              </button>
            ))}
            <div className="ml-auto text-xs text-gray-400">
              当前窗口：{filters.dateFrom} ~ {filters.dateTo}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{selectedMember ? '成员任务' : '活跃成员'}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedMember ? memberStatsMap[selectedMember.userId]?.totalTasks ?? 0 : teamStats.activeMembers}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedMember ? `期间内 ${memberStatsMap[selectedMember.userId]?.periodUsage ?? 0} 次使用` : `共 ${mockTeamMembers.length} 人`}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">窗口内任务</p>
                <p className="text-2xl font-bold text-gray-900">{selectedMember ? memberStatsMap[selectedMember.userId]?.periodUsage ?? 0 : teamStats.totalTasks}</p>
                <div className="flex items-center gap-1 mt-1">
                  {teamStats.weeklyChangeAll > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-600" />
                  ) : teamStats.weeklyChangeAll < 0 ? (
                    <ArrowDownRight className="w-3 h-3 text-red-600" />
                  ) : (
                    <Minus className="w-3 h-3 text-gray-400" />
                  )}
                  <p className={cn(
                    'text-xs font-medium',
                    teamStats.weeklyChangeAll > 0 ? 'text-green-600' :
                    teamStats.weeklyChangeAll < 0 ? 'text-red-600' : 'text-gray-400'
                  )}>
                    本周 vs 上周 {teamStats.weeklyChangeAll > 0 ? '+' : ''}{teamStats.weeklyChangeAll}%
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{selectedMember ? '个人标记率' : '平均标记率'}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedMember ? memberStatsMap[selectedMember.userId]?.avgConversionRate ?? 0 : teamStats.avgConversion}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  已标记 {selectedMember ? memberStatsMap[selectedMember.userId]?.markedTasks ?? 0 : teamStats.totalMarked} 条
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">敏感词预警</p>
                <p className={cn(
                  'text-2xl font-bold',
                  (selectedMember ? memberStatsMap[selectedMember.userId]?.hasWarning : teamStats.hasWarning) ? 'text-red-600' : 'text-gray-900'
                )}>
                  {(selectedMember ? memberStatsMap[selectedMember.userId]?.hasWarning : teamStats.hasWarning) ? '有风险' : '正常'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedMember 
                    ? `${memberStatsMap[selectedMember.userId]?.warningTasks ?? 0} 条待处理`
                    : `${teamStats.totalWarning} 条待处理`}
                </p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                (selectedMember ? memberStatsMap[selectedMember.userId]?.hasWarning : teamStats.hasWarning) ? 'bg-red-100' : 'bg-green-100'
              )}>
                <AlertTriangle className={cn(
                  'w-6 h-6',
                  (selectedMember ? memberStatsMap[selectedMember.userId]?.hasWarning : teamStats.hasWarning) ? 'text-red-600' : 'text-green-600'
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList variant="line">
              <Tab>
                <Users className="w-4 h-4" />
                {selectedMember ? '工作台详情' : '成员列表'}
              </Tab>
              <Tab>
                <BarChart3 className="w-4 h-4" />
                团队统计
              </Tab>
              <Tab>
                <Calendar className="w-4 h-4" />
                每日明细
              </Tab>
              <Tab>
                <Zap className="w-4 h-4" />
                周对比 & 风险
              </Tab>
            </TabList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <TabPanels value={activeTab}>
            <TabPanel>
              <div className="space-y-3">
                {displayMembers.map((member, idx) => {
                  const stats = memberStatsMap[member.userId];
                  const memberTasks = stats?.recentTasks ?? [];
                  const defaultExpanded = selectedMember ? true : expandedMember === member.id;
                  const isExpanded = defaultExpanded;
                  
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        'border rounded-xl transition-all overflow-hidden',
                        isExpanded ? 'border-blue-200' : 'border-gray-100 hover:border-gray-200',
                        selectedMember ? 'ring-2 ring-blue-100' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'p-4 flex items-center gap-4',
                          selectedMember ? '' : 'cursor-pointer hover:bg-gray-50 transition-colors'
                        )}
                        onClick={() => !selectedMember && setExpandedMember(isExpanded ? null : member.id)}
                      >
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg',
                          member.role === 'manager'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-blue-500 to-blue-700'
                        )}>
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <Badge variant={member.role === 'manager' ? 'amber' : 'default'} size="sm">
                              {member.role === 'manager' ? '主管' : '运营'}
                            </Badge>
                            {stats?.hasWarning && (
                              <Badge variant="warning" size="sm" dot>有风险</Badge>
                            )}
                            <div className="ml-2 flex items-center gap-1">
                              {(stats?.weeklyChange ?? 0) > 0 ? (
                                <ArrowUpRight className="w-3 h-3 text-green-500" />
                              ) : (stats?.weeklyChange ?? 0) < 0 ? (
                                <ArrowDownRight className="w-3 h-3 text-red-500" />
                              ) : (
                                <Minus className="w-3 h-3 text-gray-400" />
                              )}
                              <span className={cn(
                                'text-xs font-medium',
                                (stats?.weeklyChange ?? 0) > 0 ? 'text-green-600' :
                                (stats?.weeklyChange ?? 0) < 0 ? 'text-red-600' : 'text-gray-400'
                              )}>
                                {(stats?.weeklyChange ?? 0) > 0 ? '+' : ''}{stats?.weeklyChange ?? 0}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">最近活跃: {stats?.lastActive ?? '暂无'}</p>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{stats?.periodUsage ?? 0}</p>
                            <p className="text-xs text-gray-500">窗口内使用</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">{stats?.avgConversionRate ?? 0}%</p>
                            <p className="text-xs text-gray-500">标记率</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{stats?.totalTasks ?? 0}</p>
                            <p className="text-xs text-gray-500">总任务</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportMemberTasks(member.userId, member.name);
                            }}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            导出
                          </Button>
                          {!selectedMember && (
                            isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">窗口内使用趋势</h4>
                              <WeeklyBarChart stats={stats?.periodStats ?? []} compact />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                  最近任务 
                                  <span className="text-xs text-gray-400 font-normal ml-2">
                                    (窗口内共 {stats?.totalTasks ?? 0} 条)
                                  </span>
                                </h4>
                                {memberTasks.length === 0 ? (
                                  <div className="p-6 bg-white rounded-lg text-center border border-gray-100 border-dashed">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">筛选范围内暂无任务</p>
                                    <p className="text-xs text-gray-400 mt-1">调整筛选条件或等待该成员生成内容</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {memberTasks.map(task => (
                                      <div key={task.id} className="p-3 bg-white rounded-lg text-sm border border-gray-100">
                                        <div className="flex items-center justify-between">
                                          <p className="font-medium text-gray-900 truncate flex-1">{task.title}</p>
                                          <Badge 
                                            variant={task.status === 'marked' ? 'success' : task.status === 'warning' ? 'warning' : 'default'} 
                                            size="sm"
                                            className="ml-2 flex-shrink-0"
                                          >
                                            {task.status === 'marked' ? '已标记' : task.status === 'warning' ? '有风险' : '已完成'}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-gray-500">{formatDateTime(task.createdAt)}</span>
                                          <span className="text-xs text-gray-300">·</span>
                                          <span className="text-xs text-gray-500">{task.outputs.length} 个版本</span>
                                          <span className="text-xs text-gray-300">·</span>
                                          <span className={cn(
                                            'text-xs font-medium',
                                            task.type === 'product' ? 'text-blue-600' :
                                            task.type === 'service' ? 'text-emerald-600' :
                                            'text-purple-600'
                                          )}>
                                            {getTaskTypeLabel(task.type)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-white rounded-lg border border-gray-100">
                                  <p className="text-xs text-gray-500">商品文案</p>
                                  <p className="text-lg font-bold text-blue-600">{stats?.taskDistribution.product ?? 0}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-gray-100">
                                  <p className="text-xs text-gray-500">客服话术</p>
                                  <p className="text-lg font-bold text-emerald-600">{stats?.taskDistribution.service ?? 0}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-gray-100">
                                  <p className="text-xs text-gray-500">图片处理</p>
                                  <p className="text-lg font-bold text-purple-600">{stats?.taskDistribution.image ?? 0}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabPanel>

            <TabPanel>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">窗口内使用趋势</h3>
                        <span className="text-xs text-gray-400">{filters.dateFrom} ~ {filters.dateTo}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <WeeklyBarChart stats={teamPeriodStats} />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900">功能使用热力图</h3>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <HeatmapCalendar stats={teamPeriodStats} />
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900">功能分布</h3>
                      <p className="text-xs text-gray-500">按当前筛选统计</p>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-4">
                      {(['product', 'service', 'image'] as TaskType[]).map((type) => {
                        const count = teamTaskDistribution[type] ?? 0;
                        const total = teamTaskDistribution.product + teamTaskDistribution.service + teamTaskDistribution.image;
                        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={type} className="flex items-center gap-3">
                            <div className={cn(
                              'w-3 h-3 rounded-full flex-shrink-0',
                              type === 'product' ? 'bg-blue-500' :
                              type === 'service' ? 'bg-emerald-500' :
                              'bg-purple-500'
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {type === 'product' ? '商品文案' : type === 'service' ? '客服话术' : '图片处理'}
                                </span>
                                <span className="text-sm font-bold text-gray-900">{count}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    type === 'product' ? 'bg-blue-500' :
                                    type === 'service' ? 'bg-emerald-500' :
                                    'bg-purple-500'
                                  )}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900">成员排行</h3>
                      <p className="text-xs text-gray-500">按窗口内使用次数排序</p>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-3">
                      {sortedMembersByUsage.map((member, index) => {
                        const stats = memberStatsMap[member.userId];
                        const maxUsage = Math.max(...sortedMembersByUsage.map(m => memberStatsMap[m.userId]?.periodUsage ?? 1), 1);
                        return (
                          <div key={member.id} className="flex items-center gap-3">
                            <span className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                              index === 0 ? 'bg-amber-100 text-amber-700' :
                              index === 1 ? 'bg-gray-100 text-gray-600' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-50 text-gray-500'
                            )}>
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ 
                                    width: `${((stats?.periodUsage ?? 0) / maxUsage) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900 flex-shrink-0 w-8 text-right">
                              {stats?.periodUsage ?? 0}
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">每日任务矩阵</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedMember ? `${selectedMember.name} · ` : '团队 · '}
                          每行一位成员，每列为一天（{filters.dateFrom} ~ {filters.dateTo}）
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-blue-500 rounded-sm" /> 商品文案
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> 客服话术
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-purple-500 rounded-sm" /> 图片处理
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-xs font-medium text-gray-500 pb-3 pr-4 min-w-[140px]">成员</th>
                            {dailyMatrix.map(day => (
                              <th 
                                key={day.dateKey}
                                className={cn(
                                  'text-center pb-3 px-2 min-w-[80px] cursor-pointer transition-colors rounded-lg',
                                  selectedDayKey === day.dateKey ? 'bg-blue-50' : 'hover:bg-gray-50'
                                )}
                                onClick={() => {
                                  setSelectedDayKey(day.dateKey);
                                  setShowDayDetail(true);
                                }}
                              >
                                <p className="text-xs font-medium text-gray-700">{day.dateLabel}</p>
                                <p className="text-xs text-gray-400">{day.dayLabel}</p>
                              </th>
                            ))}
                            <th className="text-center pb-3 px-2 min-w-[80px] text-xs font-medium text-gray-500">合计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayMembers.map(member => {
                            const memberTotal = dailyMatrix.reduce((sum, d) => sum + (d.tasks[member.userId]?.total ?? 0), 0);
                            return (
                              <tr key={member.id}>
                                <td className="py-2 pr-4">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      'w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold',
                                      member.role === 'manager'
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                        : 'bg-gradient-to-br from-blue-500 to-blue-700'
                                    )}>
                                      {member.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{member.name}</span>
                                  </div>
                                </td>
                                {dailyMatrix.map(day => {
                                  const entry = day.tasks[member.userId];
                                  const total = entry?.total ?? 0;
                                  return (
                                    <td 
                                      key={`${member.id}-${day.dateKey}`}
                                      className={cn(
                                        'py-2 px-2 text-center align-middle',
                                        selectedDayKey === day.dateKey ? 'bg-blue-50' : ''
                                      )}
                                    >
                                      {total === 0 ? (
                                        <span className="text-xs text-gray-300">-</span>
                                      ) : (
                                        <div className="inline-flex flex-col gap-0.5 items-center">
                                          <div className="flex gap-0.5">
                                            {entry!.byType.product > 0 && (
                                              <span 
                                                className="w-2.5 h-2.5 bg-blue-500 rounded-sm" 
                                                title={`商品文案 ${entry!.byType.product}`}
                                              />
                                            )}
                                            {entry!.byType.service > 0 && (
                                              <span 
                                                className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"
                                                title={`客服话术 ${entry!.byType.service}`}
                                              />
                                            )}
                                            {entry!.byType.image > 0 && (
                                              <span 
                                                className="w-2.5 h-2.5 bg-purple-500 rounded-sm"
                                                title={`图片处理 ${entry!.byType.image}`}
                                              />
                                            )}
                                          </div>
                                          <span className="text-xs font-semibold text-gray-700">{total}</span>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="py-2 px-2 text-center">
                                  <span className={cn(
                                    'text-xs font-bold',
                                    memberTotal > 0 ? 'text-gray-900' : 'text-gray-300'
                                  )}>
                                    {memberTotal > 0 ? memberTotal : '-'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-200">
                            <td className="py-3 pr-4 text-sm font-semibold text-gray-700">每日合计</td>
                            {dailyMatrix.map(day => {
                              const dayTotal = Object.values(day.tasks).reduce((sum, e) => sum + e.total, 0);
                              return (
                                <td 
                                  key={`total-${day.dateKey}`}
                                  className={cn(
                                    'py-3 px-2 text-center font-bold cursor-pointer rounded-lg transition-colors',
                                    selectedDayKey === day.dateKey ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                  )}
                                  onClick={() => {
                                    setSelectedDayKey(day.dateKey);
                                    setShowDayDetail(true);
                                  }}
                                >
                                  {dayTotal > 0 ? dayTotal : '-'}
                                </td>
                              );
                            })}
                            <td className="py-3 px-2 text-center">
                              <span className="text-sm font-bold text-gray-900">{filteredTasks.length}</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {showDayDetail && selectedDayDetail && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            {selectedDayDetail.dateLabel} {selectedDayDetail.dayLabel} 任务明细
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            共 {Object.values(selectedDayDetail.tasks).reduce((sum, e) => sum + e.total, 0)} 条任务
                            {selectedMember ? ` · ${selectedMember.name}` : ''}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowDayDetail(false)}>
                          <X className="w-3.5 h-3.5" />
                          收起
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="space-y-4">
                        {displayMembers.map(member => {
                          const dayTasks = selectedDayDetail.tasks[member.userId]?.tasks ?? [];
                          if (dayTasks.length === 0) return null;

                          return (
                            <div key={member.id}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={cn(
                                  'w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold',
                                  member.role === 'manager'
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                    : 'bg-gradient-to-br from-blue-500 to-blue-700'
                                )}>
                                  {member.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{member.name}</span>
                                <Badge variant="default" size="sm">{dayTasks.length} 条</Badge>
                              </div>
                              <div className="space-y-2 pl-8">
                                {dayTasks
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                  .map(task => (
                                    <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500">{formatDateTime(task.createdAt)}</span>
                                            <span className="text-xs text-gray-300">·</span>
                                            <span className={cn(
                                              'text-xs font-medium px-1.5 py-0.5 rounded',
                                              task.type === 'product' ? 'bg-blue-100 text-blue-700' :
                                              task.type === 'service' ? 'bg-emerald-100 text-emerald-700' :
                                              'bg-purple-100 text-purple-700'
                                            )}>
                                              {getTaskTypeLabel(task.type)}
                                            </span>
                                            <span className="text-xs text-gray-300">·</span>
                                            <span className="text-xs text-gray-500">{task.outputs.length} 个版本</span>
                                          </div>
                                        </div>
                                        <Badge 
                                          variant={task.status === 'marked' ? 'success' : task.status === 'warning' ? 'warning' : 'default'} 
                                          size="sm"
                                        >
                                          {task.status === 'marked' ? '已标记' : task.status === 'warning' ? '有风险' : '已完成'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          );
                        })}
                        {Object.values(selectedDayDetail.tasks).every(e => e.total === 0) && (
                          <div className="text-center py-8">
                            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">该日期筛选范围内暂无任务记录</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabPanel>

            <TabPanel>
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">本周 vs 上周对比</h3>
                        <p className="text-xs text-gray-500 mt-1">每位成员两周任务数环比变化</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleExportWeekCompare}>
                        <Download className="w-3.5 h-3.5" />
                        导出周对比
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-3">
                      {weekComparison.map(w => (
                        <div key={w.member.id} className="p-4 border border-gray-100 rounded-xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={cn(
                              'w-9 h-9 rounded-md flex items-center justify-center text-white font-bold',
                              w.member.role === 'manager'
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                : 'bg-gradient-to-br from-blue-500 to-blue-700'
                            )}>
                              {w.member.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{w.member.name}</p>
                                <Badge variant={w.member.role === 'manager' ? 'amber' : 'default'} size="sm">
                                  {w.member.role === 'manager' ? '主管' : '运营'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {w.weekChange > 0 ? (
                                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                                ) : w.weekChange < 0 ? (
                                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                                ) : (
                                  <Minus className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={cn(
                                  'text-lg font-bold',
                                  w.weekChange > 0 ? 'text-green-600' :
                                  w.weekChange < 0 ? 'text-red-600' : 'text-gray-500'
                                )}>
                                  {w.weekChange > 0 ? '+' : ''}{w.weekChange}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                本周 {w.thisWeekTasks} vs 上周 {w.lastWeekTasks}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {w.typeChanges.map(tc => (
                              <div key={tc.type} className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">
                                  {tc.type === 'product' ? '商品文案' : tc.type === 'service' ? '客服话术' : '图片处理'}
                                </p>
                                <div className="flex items-end justify-between">
                                  <div>
                                    <p className="text-base font-bold text-gray-900">{tc.thisWeek}</p>
                                    <p className="text-xs text-gray-400">上周 {tc.lastWeek}</p>
                                  </div>
                                  {tc.change !== 0 && (
                                    <div className={cn(
                                      'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
                                      tc.change > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    )}>
                                      {tc.change > 0 ? (
                                        <ArrowUpRight className="w-3 h-3" />
                                      ) : (
                                        <ArrowDownRight className="w-3 h-3" />
                                      )}
                                      {tc.change > 0 ? '+' : ''}{tc.change}%
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        功能类型涨幅排行
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">本周 vs 上周变化幅度</p>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-2">
                      {(['product', 'service', 'image'] as TaskType[]).map(type => {
                        const tw = weekComparison.reduce((s, w) => s + w.thisWeekByType[type], 0);
                        const lw = weekComparison.reduce((s, w) => s + w.lastWeekByType[type], 0);
                        const ch = lw === 0 ? (tw > 0 ? 100 : 0) : Math.round(((tw - lw) / lw) * 100);
                        return (
                          <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'w-2 h-6 rounded',
                                type === 'product' ? 'bg-blue-500' :
                                type === 'service' ? 'bg-emerald-500' : 'bg-purple-500'
                              )} />
                              <span className="text-sm font-medium text-gray-700">
                                {type === 'product' ? '商品文案' : type === 'service' ? '客服话术' : '图片处理'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className={cn(
                                'text-base font-bold',
                                ch > 0 ? 'text-green-600' : ch < 0 ? 'text-red-600' : 'text-gray-500'
                              )}>
                                {ch > 0 ? '+' : ''}{ch}%
                              </div>
                              <p className="text-xs text-gray-400">{lw} → {tw}</p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        风险任务跟进
                        {warningTasksList.length > 0 && (
                          <Badge variant="warning" size="sm">{warningTasksList.length}</Badge>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">含敏感词（danger 级）的任务清单</p>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {warningTasksList.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">暂无风险任务，团队表现良好！</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[360px] overflow-y-auto">
                          {warningTasksList.slice(0, 8).map(({ task, member, dangerCount }) => (
                            <div key={task.id} className="p-3 border border-red-100 bg-red-50/50 rounded-lg">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    {member?.name}
                                    <span>·</span>
                                    {formatDate(task.createdAt)}
                                    <span>·</span>
                                    {getTaskTypeLabel(task.type)}
                                  </div>
                                </div>
                                <Badge variant="warning" size="sm">{dangerCount} 个敏感词</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
