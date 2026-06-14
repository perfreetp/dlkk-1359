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
  Filter,
  X,
  CheckCircle2,
  ListFilter
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
  weeklyUsage: number;
  weeklyStats: UsageStats[];
  markedTasks: number;
  completedTasks: number;
  warningTasks: number;
  recentTasks: Task[];
  taskDistribution: Record<TaskType, number>;
  avgConversionRate: number;
  hasWarning: boolean;
  lastActive: string;
}

interface Filters {
  memberId: string;
  taskType: string;
  dateFrom: string;
  dateTo: string;
}

const calcConversionRate = (marked: number, total: number): number => {
  if (total === 0) return 0;
  const rate = (marked / total) * 100;
  return Math.round(rate * 10) / 10;
};

const emptyDateStr = (): { from: string; to: string } => {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  return {
    from: weekAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

const TeamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const defaultDates = emptyDateStr();
  const [filters, setFilters] = useState<Filters>({
    memberId: 'all',
    taskType: 'all',
    dateFrom: defaultDates.from,
    dateTo: defaultDates.to,
  });

  const { getTeamTasks } = useTaskStore();
  
  const allTasks = useMemo(() => getTeamTasks(), [getTeamTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      if (filters.memberId !== 'all' && task.userId !== filters.memberId) return false;
      if (filters.taskType !== 'all' && task.type !== filters.taskType) return false;
      if (filters.dateFrom) {
        const taskDate = new Date(task.createdAt);
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (taskDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const taskDate = new Date(task.createdAt);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (taskDate > toDate) return false;
      }
      return true;
    });
  }, [allTasks, filters]);

  const getFilteredTasksByUserId = (userId: string) => {
    return filteredTasks
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const memberOptions: SelectOption[] = [
    { value: 'all', label: '全部成员' },
    ...mockTeamMembers.map(m => ({ value: m.userId, label: m.name })),
  ];

  const typeOptions: SelectOption[] = [
    { value: 'all', label: '全部类型' },
    { value: 'product', label: '商品文案' },
    { value: 'service', label: '客服话术' },
    { value: 'image', label: '图片处理' },
  ];

  const getWeeklyStats = (tasks: Task[]) => {
    const stats = new Array(7).fill(0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    tasks.forEach(task => {
      const taskDate = new Date(task.createdAt);
      const diffDays = Math.floor((today.getTime() - new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        stats[6 - diffDays]++;
      }
    });

    return stats.map((count, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        count,
        taskType: 'product' as TaskType,
        userId: 'filtered',
      };
    });
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
      const memberTasks = getFilteredTasksByUserId(userId);
      const weeklyStats = getWeeklyStats(memberTasks);
      const taskDistribution = getTaskDistribution(memberTasks);
      const weeklyUsage = weeklyStats.reduce((sum, s) => sum + s.count, 0);
      const markedTasks = memberTasks.filter(t => t.status === 'marked').length;
      const completedTasks = memberTasks.filter(t => t.status === 'completed').length;
      const warningTasks = memberTasks.filter(t => 
        t.outputs.some(o => o.sensitiveWords.some(s => s.level === 'danger'))
      ).length;
      const hasWarning = warningTasks > 0;
      const avgConversionRate = calcConversionRate(markedTasks, memberTasks.length);
      const lastActive = getLastActive(memberTasks);

      map[userId] = {
        member,
        totalTasks: memberTasks.length,
        weeklyUsage,
        weeklyStats,
        markedTasks,
        completedTasks,
        warningTasks,
        recentTasks: memberTasks.slice(0, 5),
        taskDistribution,
        avgConversionRate,
        hasWarning,
        lastActive,
      };
    });
    return map;
  }, [filteredTasks]);

  const teamStats = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const totalUsage = Object.values(memberStatsMap).reduce((sum, m) => sum + m.weeklyUsage, 0);
    const activeMembers = Object.values(memberStatsMap).filter(m => m.totalTasks > 0).length;
    const avgConversion = activeMembers > 0
      ? Math.round(
          (Object.values(memberStatsMap).reduce((sum, m) => sum + m.avgConversionRate, 0) / activeMembers) * 10
        ) / 10
      : 0;
    const hasWarning = Object.values(memberStatsMap).some(m => m.hasWarning);
    const totalMarked = Object.values(memberStatsMap).reduce((sum, m) => sum + m.markedTasks, 0);
    
    return { totalTasks, totalUsage, avgConversion, hasWarning, totalMarked, activeMembers };
  }, [filteredTasks, memberStatsMap]);

  const teamTaskDistribution = useMemo(() => getTaskDistribution(filteredTasks), [filteredTasks]);

  const sortedMembersByUsage = useMemo(() => 
    [...mockTeamMembers].sort((a, b) => 
      memberStatsMap[b.userId]?.weeklyUsage - memberStatsMap[a.userId]?.weeklyUsage
    ),
  [memberStatsMap]);

  const teamWeeklyStats = useMemo(() => getWeeklyStats(filteredTasks), [filteredTasks]);

  const dailyMatrix = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days: Array<{
      dateKey: string;
      dateLabel: string;
      dayLabel: string;
      tasks: Record<string, { total: number; byType: Record<TaskType, number>; tasks: Task[] }>;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      
      const tasksByMember: Record<string, { total: number; byType: Record<TaskType, number>; tasks: Task[] }> = {};
      
      mockTeamMembers.forEach(m => {
        tasksByMember[m.userId] = { total: 0, byType: { product: 0, service: 0, image: 0 }, tasks: [] };
      });

      filteredTasks.forEach(task => {
        const taskDateKey = new Date(task.createdAt).toISOString().split('T')[0];
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
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        dayLabel: weekDays[date.getDay()],
        tasks: tasksByMember,
      });
    }

    return days;
  }, [filteredTasks]);

  const selectedDayDetail = useMemo(() => {
    if (!selectedDayKey) return null;
    return dailyMatrix.find(d => d.dateKey === selectedDayKey) || null;
  }, [selectedDayKey, dailyMatrix]);

  const handleResetFilters = () => {
    const dates = emptyDateStr();
    setFilters({
      memberId: 'all',
      taskType: 'all',
      dateFrom: dates.from,
      dateTo: dates.to,
    });
    setExpandedMember(null);
  };

  const hasActiveFilters = filters.memberId !== 'all' || filters.taskType !== 'all';

  const handleExportOverview = () => {
    const rows = sortedMembersByUsage.map(member => {
      const stats = memberStatsMap[member.userId];
      return {
        姓名: member.name,
        角色: member.role === 'manager' ? '主管' : '运营',
        筛选范围: `${filters.dateFrom || '不限'} 至 ${filters.dateTo || '不限'}`,
        成员过滤: filters.memberId === 'all' ? '全部' : member.name,
        类型过滤: filters.taskType === 'all' ? '全部' : getTaskTypeLabel(filters.taskType),
        本周使用次数: stats?.weeklyUsage ?? 0,
        标记率: `${stats?.avgConversionRate ?? 0}%`,
        总任务数: stats?.totalTasks ?? 0,
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
        };
      });
    
    downloadCSV(rows, `任务明细_${filters.dateFrom}_${filters.dateTo}`);
  };

  const handleExportMemberTasks = (userId: string, memberName: string) => {
    const memberTasks = getFilteredTasksByUserId(userId);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-600" />
            团队管理
          </h1>
          <p className="text-gray-500 mt-1">查看团队成员使用情况，导出统计报表</p>
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
          <div className="grid grid-cols-4 gap-4">
            <Select
              label="成员"
              value={filters.memberId}
              onChange={(e) => setFilters(f => ({ ...f, memberId: e.target.value }))}
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
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">结束日期</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">团队成员</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.activeMembers}</p>
                <p className="text-xs text-gray-400 mt-1">共 {mockTeamMembers.length} 人</p>
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
                <p className="text-sm text-gray-500 mb-1">筛选范围内任务</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.totalTasks}</p>
                <p className="text-xs text-gray-400 mt-1">本周使用 {teamStats.totalUsage} 次</p>
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
                <p className="text-sm text-gray-500 mb-1">平均标记率</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.avgConversion}%</p>
                <p className="text-xs text-gray-400 mt-1">已标记 {teamStats.totalMarked} 条</p>
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
                  teamStats.hasWarning ? 'text-red-600' : 'text-gray-900'
                )}>
                  {teamStats.hasWarning ? '有风险' : '正常'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {Object.values(memberStatsMap).reduce((sum, m) => sum + m.warningTasks, 0)} 条待处理
                </p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                teamStats.hasWarning ? 'bg-red-100' : 'bg-green-100'
              )}>
                <AlertTriangle className={cn(
                  'w-6 h-6',
                  teamStats.hasWarning ? 'text-red-600' : 'text-green-600'
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
                成员列表
              </Tab>
              <Tab>
                <BarChart3 className="w-4 h-4" />
                团队统计
              </Tab>
              <Tab>
                <Calendar className="w-4 h-4" />
                每日明细
              </Tab>
            </TabList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <TabPanels value={activeTab}>
            <TabPanel>
              <div className="space-y-3">
                {sortedMembersByUsage.map(member => {
                  const stats = memberStatsMap[member.userId];
                  const memberTasks = stats?.recentTasks ?? [];
                  const isExpanded = expandedMember === member.id;
                  
                  return (
                    <div
                      key={member.id}
                      className={cn(
                        'border rounded-xl transition-all overflow-hidden',
                        isExpanded ? 'border-blue-200' : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <div
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedMember(isExpanded ? null : member.id)}
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
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">最近活跃: {stats?.lastActive ?? '暂无'}</p>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{stats?.weeklyUsage ?? 0}</p>
                            <p className="text-xs text-gray-500">筛选内使用</p>
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
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">筛选范围内使用趋势</h4>
                              <WeeklyBarChart stats={stats?.weeklyStats ?? []} compact />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                  最近任务 
                                  <span className="text-xs text-gray-400 font-normal ml-2">
                                    (筛选范围内共 {stats?.totalTasks ?? 0} 条)
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
                      <h3 className="text-sm font-semibold text-gray-900">筛选范围内使用趋势</h3>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <WeeklyBarChart stats={teamWeeklyStats} />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900">功能使用热力图</h3>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <HeatmapCalendar stats={teamWeeklyStats} />
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
                      <p className="text-xs text-gray-500">按筛选范围内使用次数排序</p>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-3">
                      {sortedMembersByUsage.map((member, index) => {
                        const stats = memberStatsMap[member.userId];
                        const maxUsage = Math.max(...sortedMembersByUsage.map(m => memberStatsMap[m.userId]?.weeklyUsage ?? 1), 1);
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
                                    width: `${((stats?.weeklyUsage ?? 0) / maxUsage) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900 flex-shrink-0 w-8 text-right">
                              {stats?.weeklyUsage ?? 0}
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
                        <p className="text-xs text-gray-500 mt-1">每行一位成员，每列为一天，点击日期查看当日任务明细</p>
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
                      <table className="w-full border-collapse">
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
                            <th className="text-center pb-3 px-2 min-w-[60px] text-xs font-medium text-gray-500">合计</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockTeamMembers.map(member => {
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
                        {mockTeamMembers.map(member => {
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
          </TabPanels>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagement;
