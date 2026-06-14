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
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../components/ui/Tab';
import { Badge } from '../components/ui/Badge';
import { WeeklyBarChart, TypeDistribution, HeatmapCalendar } from '../components/StatsChart';
import { useTaskStore } from '../store/useTaskStore';
import { mockTeamMembers } from '../mock/users';
import { downloadCSV, formatDate, getTaskTypeLabel } from '../utils/formatters';
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

const calcConversionRate = (marked: number, total: number): number => {
  if (total === 0) return 0;
  const rate = (marked / total) * 100;
  return Math.round(rate * 10) / 10;
};

const TeamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const { getTeamTasks, getTeamUsageStats } = useTaskStore();
  
  const allTasks = useMemo(() => getTeamTasks(), [getTeamTasks]);
  const allUsageStats = useMemo(() => getTeamUsageStats(), [getTeamUsageStats]);

  const getWeeklyStats = (userId: string) => {
    const stats = new Array(7).fill(0);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    allTasks.forEach(task => {
      if (task.userId !== userId) return;
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
        userId,
      };
    });
  };

  const getTaskDistribution = (userId: string): Record<TaskType, number> => {
    const dist: Record<TaskType, number> = { product: 0, service: 0, image: 0 };
    allTasks.filter(t => t.userId === userId).forEach(t => {
      dist[t.type]++;
    });
    return dist;
  };

  const getWeeklyUsage = (userId: string): number => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    
    return allTasks.filter(t => {
      if (t.userId !== userId) return false;
      const taskDate = new Date(t.createdAt);
      return taskDate >= weekAgo && taskDate <= new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length;
  };

  const getMemberTasks = (userId: string) => {
    return allTasks
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getLastActive = (userId: string): string => {
    const memberTasks = allTasks.filter(t => t.userId === userId);
    if (memberTasks.length === 0) return '暂无活动';
    
    const latest = memberTasks.reduce((a, b) => 
      new Date(a.createdAt) > new Date(b.createdAt) ? a : b
    );
    return formatDate(latest.createdAt);
  };

  const memberStatsMap = useMemo(() => {
    const map: Record<string, MemberComputedStats> = {};
    mockTeamMembers.forEach(member => {
      const userId = member.userId;
      const memberTasks = getMemberTasks(userId);
      const weeklyStats = getWeeklyStats(userId);
      const taskDistribution = getTaskDistribution(userId);
      const weeklyUsage = getWeeklyUsage(userId);
      const markedTasks = memberTasks.filter(t => t.status === 'marked').length;
      const completedTasks = memberTasks.filter(t => t.status === 'completed').length;
      const warningTasks = memberTasks.filter(t => 
        t.outputs.some(o => o.sensitiveWords.some(s => s.level === 'danger'))
      ).length;
      const hasWarning = warningTasks > 0;
      const avgConversionRate = calcConversionRate(markedTasks, memberTasks.length);
      const lastActive = getLastActive(userId);

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
  }, [allTasks]);

  const teamStats = useMemo(() => {
    const totalTasks = allTasks.length;
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
  }, [allTasks, memberStatsMap]);

  const teamTaskDistribution = useMemo(() => {
    const dist: Record<TaskType, number> = { product: 0, service: 0, image: 0 };
    allTasks.forEach(t => {
      dist[t.type]++;
    });
    return dist;
  }, [allTasks]);

  const filteredMembers = useMemo(() => 
    mockTeamMembers.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [searchQuery]);

  const sortedMembersByUsage = useMemo(() => 
    [...filteredMembers].sort((a, b) => 
      memberStatsMap[b.userId]?.weeklyUsage - memberStatsMap[a.userId]?.weeklyUsage
    ),
  [filteredMembers, memberStatsMap]);

  const teamWeeklyStats = useMemo(() => {
    const aggregated: Record<string, { date: string; count: number; taskType: TaskType; userId: string }> = {};
    Object.values(memberStatsMap).forEach(m => {
      m.weeklyStats.forEach(stat => {
        if (!aggregated[stat.date]) {
          aggregated[stat.date] = { ...stat };
        } else {
          aggregated[stat.date].count += stat.count;
        }
      });
    });
    return Object.values(aggregated).sort((a, b) => a.date.localeCompare(b.date));
  }, [memberStatsMap]);

  const teamWeeklyStatsByType = useMemo(() => {
    const stats: Array<{ date: string; count: number; taskType: TaskType; userId: string }> = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = allTasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        const taskDateStr = taskDate.toISOString().split('T')[0];
        return taskDateStr === dateStr;
      });
      
      (['product', 'service', 'image'] as TaskType[]).forEach(type => {
        const count = dayTasks.filter(t => t.type === type).length;
        stats.push({
          date: dateStr,
          count,
          taskType: type,
          userId: 'team',
        });
      });
    }
    
    return stats;
  }, [allTasks]);

  const handleExportReport = () => {
    const reportData = mockTeamMembers.map(member => {
      const stats = memberStatsMap[member.userId];
      return {
        姓名: member.name,
        角色: member.role === 'manager' ? '主管' : '运营',
        本周使用次数: stats?.weeklyUsage ?? 0,
        平均转化率: `${stats?.avgConversionRate ?? 0}%`,
        总任务数: stats?.totalTasks ?? 0,
        已标记任务: stats?.markedTasks ?? 0,
        已完成任务: stats?.completedTasks ?? 0,
        有风险任务: stats?.warningTasks ?? 0,
        商品文案: stats?.taskDistribution.product ?? 0,
        客服话术: stats?.taskDistribution.service ?? 0,
        图片处理: stats?.taskDistribution.image ?? 0,
        最近活跃: stats?.lastActive ?? '暂无',
        加入时间: member.joinDate,
      };
    });
    
    downloadCSV(reportData, `团队使用报告_${new Date().toLocaleDateString()}`);
  };

  const handleExportTasks = (userId: string, memberName: string) => {
    const memberTasks = getMemberTasks(userId);
    const reportData = memberTasks.map(task => ({
      任务名称: task.title,
      任务类型: getTaskTypeLabel(task.subType),
      任务大类: getTaskTypeLabel(task.type),
      状态: task.status === 'marked' ? '已标记' : task.status === 'warning' ? '有风险' : '已完成',
      版本数: task.outputs.length,
      创建时间: formatDate(task.createdAt),
      类目: task.category || '-',
    }));
    
    downloadCSV(reportData, `${memberName}_任务记录_${new Date().toLocaleDateString()}`);
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4" />
            导出团队报告
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">团队成员</p>
                <p className="text-2xl font-bold text-gray-900">{mockTeamMembers.length}</p>
                <p className="text-xs text-gray-400 mt-1">活跃 {teamStats.activeMembers} 人</p>
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
                <p className="text-sm text-gray-500 mb-1">本周使用次数</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.totalUsage}</p>
                <p className="text-xs text-gray-400 mt-1">累计 {teamStats.totalTasks} 次</p>
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
            </TabList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <TabPanels value={activeTab}>
            <TabPanel>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Input
                    placeholder="搜索成员姓名..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Eye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-3">
                {filteredMembers.map(member => {
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
                            <p className="text-xs text-gray-500">本周使用</p>
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
                              handleExportTasks(member.userId, member.name);
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
                              <h4 className="text-sm font-medium text-gray-700 mb-3">本周使用趋势</h4>
                              <WeeklyBarChart stats={stats?.weeklyStats ?? []} compact />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">最近任务</h4>
                                {memberTasks.length === 0 ? (
                                  <div className="p-6 bg-white rounded-lg text-center border border-gray-100 border-dashed">
                                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">暂无任务记录</p>
                                    <p className="text-xs text-gray-400 mt-1">该成员尚未生成过任何内容</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {memberTasks.slice(0, 5).map(task => (
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
                                          <span className="text-xs text-gray-500">{formatDate(task.createdAt)}</span>
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
                      <h3 className="text-sm font-semibold text-gray-900">本周使用趋势</h3>
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
                      <p className="text-xs text-gray-500">按任务类型统计</p>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-4">
                      {(['product', 'service', 'image'] as TaskType[]).map((type, index) => {
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
                      <p className="text-xs text-gray-500">按本周使用次数</p>
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

                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        快捷操作
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-2">
                      <Button variant="outline" fullWidth className="justify-start" onClick={handleExportReport}>
                        <Download className="w-4 h-4" />
                        导出周报
                      </Button>
                      <Button variant="outline" fullWidth className="justify-start" onClick={handleExportReport}>
                        <FileText className="w-4 h-4" />
                        导出月报
                      </Button>
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
