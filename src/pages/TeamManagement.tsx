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
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../components/ui/Tab';
import { Badge } from '../components/ui/Badge';
import { WeeklyBarChart, TypeDistribution, HeatmapCalendar } from '../components/StatsChart';
import { useTaskStore } from '../store/useTaskStore';
import { mockTeamMembers } from '../mock/users';
import { downloadCSV } from '../utils/formatters';
import { Task } from '../types';
import { cn } from '../lib/utils';

const TeamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const { tasks } = useTaskStore();

  const filteredMembers = useMemo(() => 
    mockTeamMembers.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [searchQuery]);

  const teamStats = useMemo(() => {
    const totalTasks = tasks.length;
    const totalUsage = mockTeamMembers.reduce((sum, m) => sum + m.weeklyUsage, 0);
    const avgConversion = mockTeamMembers.reduce((sum, m) => sum + m.avgConversionRate, 0) / mockTeamMembers.length;
    const hasWarning = tasks.some(t => t.status === 'warning');
    
    return { totalTasks, totalUsage, avgConversion, hasWarning };
  }, [tasks]);

  const getMemberTasks = (memberId: string) => {
    return tasks.filter(t => t.createdBy === memberId);
  };

  const getMemberWeeklyStats = (memberId: string) => {
    const memberTasks = getMemberTasks(memberId);
    const stats = new Array(7).fill(0);
    const now = new Date();
    
    memberTasks.forEach(task => {
      const taskDate = new Date(task.createdAt);
      const diffDays = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        stats[6 - diffDays]++;
      }
    });

    return stats.map((count, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        count,
      };
    });
  };

  const handleExportReport = () => {
    const reportData = mockTeamMembers.map(member => ({
      姓名: member.name,
      角色: member.role === 'manager' ? '主管' : '运营',
      本周使用次数: member.weeklyUsage,
      平均转化率: `${member.avgConversionRate}%`,
      模板收藏数: member.favoriteCount,
      总任务数: getMemberTasks(member.id).length,
      加入时间: member.joinDate,
    }));
    
    downloadCSV(reportData, `团队使用报告_${new Date().toLocaleDateString()}`);
  };

  const handleExportTasks = (memberId: string, memberName: string) => {
    const memberTasks = getMemberTasks(memberId);
    const reportData = memberTasks.map(task => ({
      任务名称: task.title,
      任务类型: task.type,
      子类型: task.subType,
      状态: task.status === 'marked' ? '已标记' : task.status === 'warning' ? '有风险' : '已完成',
      版本数: task.outputs.length,
      创建时间: task.createdAt,
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
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              较上周 +15.3%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">平均转化率</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.avgConversion.toFixed(1)}%</p>
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
                  const memberTasks = getMemberTasks(member.id);
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
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{member.weeklyUsage}</p>
                            <p className="text-xs text-gray-500">本周使用</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">{member.avgConversionRate}%</p>
                            <p className="text-xs text-gray-500">转化率</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{memberTasks.length}</p>
                            <p className="text-xs text-gray-500">总任务</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportTasks(member.id, member.name);
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
                              <WeeklyBarChart stats={getMemberWeeklyStats(member.id)} compact />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">最近任务</h4>
                                {memberTasks.slice(0, 3).length === 0 ? (
                                  <p className="text-sm text-gray-500">暂无任务记录</p>
                                ) : (
                                  <div className="space-y-2">
                                    {memberTasks.slice(0, 3).map(task => (
                                      <div key={task.id} className="p-2 bg-white rounded-lg text-sm">
                                        <p className="font-medium text-gray-900 truncate">{task.title}</p>
                                        <p className="text-xs text-gray-500">{task.outputs.length} 个版本</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white rounded-lg">
                                  <p className="text-xs text-gray-500">收藏模板</p>
                                  <p className="text-lg font-bold text-amber-600">{member.favoriteCount}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg">
                                  <p className="text-xs text-gray-500">加入时间</p>
                                  <p className="text-sm font-medium text-gray-900">{member.joinDate}</p>
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
                  <WeeklyBarChart 
                    stats={mockTeamMembers.flatMap(m => getMemberWeeklyStats(m.id))} 
                  />
                  <HeatmapCalendar 
                    stats={mockTeamMembers.flatMap(m => getMemberWeeklyStats(m.id))} 
                  />
                </div>
                <div className="space-y-6">
                  <TypeDistribution 
                    stats={mockTeamMembers.flatMap(m => getMemberWeeklyStats(m.id))} 
                  />
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900">成员排行</h3>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-3">
                      {[...mockTeamMembers]
                        .sort((a, b) => b.weeklyUsage - a.weeklyUsage)
                        .map((member, index) => (
                          <div key={member.id} className="flex items-center gap-3">
                            <span className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                              index === 0 ? 'bg-amber-100 text-amber-700' :
                              index === 1 ? 'bg-gray-100 text-gray-600' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-50 text-gray-500'
                            )}>
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                                <div 
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ 
                                    width: `${(member.weeklyUsage / Math.max(...mockTeamMembers.map(m => m.weeklyUsage))) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{member.weeklyUsage}</span>
                          </div>
                        ))}
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
                      <Button variant="outline" fullWidth className="justify-start">
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
