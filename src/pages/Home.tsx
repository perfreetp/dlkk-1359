import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  Image, 
  Clock, 
  User,
  TrendingUp,
  Star,
  Zap,
  ArrowRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { WeeklyBarChart, TypeDistribution, HeatmapCalendar } from '../components/StatsChart';
import { useTaskStore } from '../store/useTaskStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useUserStore } from '../store/useUserStore';
import { getTaskTypeLabel, getTaskTypeColor, formatDate, truncateText } from '../utils/formatters';
import { cn } from '../lib/utils';

const featureCards = [
  { 
    path: '/product-copy', 
    title: '商品文案', 
    description: '智能生成标题、卖点，提升转化率',
    icon: FileText, 
    gradient: 'from-blue-500 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-100',
  },
  { 
    path: '/customer-service', 
    title: '客服话术', 
    description: '差评回复、活动短信、竞品分析',
    icon: MessageSquare, 
    gradient: 'from-green-500 to-emerald-700',
    bgGradient: 'from-green-50 to-emerald-100',
  },
  { 
    path: '/image-processing', 
    title: '图片处理', 
    description: '背景替换、智能裁剪，适配多平台',
    icon: Image, 
    gradient: 'from-purple-500 to-violet-700',
    bgGradient: 'from-purple-50 to-violet-100',
  },
  { 
    path: '/history', 
    title: '历史任务', 
    description: '查看历史记录，对比多版输出',
    icon: Clock, 
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-100',
  },
  { 
    path: '/account', 
    title: '账号中心', 
    description: '品牌语气设置、使用统计分析',
    icon: User, 
    gradient: 'from-rose-500 to-pink-700',
    bgGradient: 'from-rose-50 to-pink-100',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { usageStats, tasks } = useTaskStore();
  const { getTopTemplates } = useTemplateStore();
  const { currentUser } = useUserStore();

  const topTemplates = getTopTemplates(undefined, 4);
  const recentTasks = useMemo(() => tasks.slice(0, 3), [tasks]);
  
  const pendingDanger = useMemo(() => 
    tasks.filter(t => 
      t.outputs.some(o => o.sensitiveWords.some(s => s.level === 'danger'))
    ).length
  , [tasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-gray-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <Badge variant="amber" className="bg-amber-400/20 text-amber-200 border-0">
              欢迎回来，{currentUser?.name}！
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold mb-3">
            今天想做什么？
          </h1>
          <p className="text-blue-200 mb-6 max-w-xl">
            选择下方的功能卡片，快速开始您的工作。AI将帮助您高效完成商品文案、客服话术和图片处理。
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/product-copy')}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Zap className="w-5 h-5" />
              立即开始
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/history')}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
            >
              <Clock className="w-5 h-5" />
              查看历史
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">本周使用次数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageStats.reduce((sum, s) => sum + s.count, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              较上周 +12.5%
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">高转化模板</p>
                <p className="text-2xl font-bold text-gray-900">
                  {topTemplates.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              最高转化率 {Math.max(...topTemplates.map(t => t.conversionRate || 0), 0)}%
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">敏感词预警</p>
                <p className={cn(
                  'text-2xl font-bold',
                  pendingDanger > 0 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {pendingDanger}
                </p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                pendingDanger > 0 ? 'bg-red-100' : 'bg-green-100'
              )}>
                <AlertTriangle className={cn(
                  'w-6 h-6',
                  pendingDanger > 0 ? 'text-red-600' : 'text-green-600'
                )} />
              </div>
            </div>
            <p className={cn(
              'text-xs mt-2',
              pendingDanger > 0 ? 'text-red-600' : 'text-green-600'
            )}>
              {pendingDanger > 0 ? `${pendingDanger}个内容需要处理` : '一切正常'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速开始</h2>
        <div className="grid grid-cols-3 gap-4 animate-stagger">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            const usageCount = tasks.filter(t => t.type === feature.path.split('/')[1]?.split('-')[0] as any).length;
            
            return (
              <Card 
                key={feature.path}
                hover
                className="cursor-pointer group overflow-hidden"
                onClick={() => navigate(feature.path)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br transition-transform group-hover:scale-110',
                      feature.gradient
                    )}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{feature.description}</p>
                      <Badge variant="default" size="sm">
                        已使用 {usageCount} 次
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <WeeklyBarChart stats={usageStats} />
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h3 className="text-sm font-semibold text-gray-900">最近任务</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                查看全部
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-2 space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">暂无任务记录</p>
              ) : (
                recentTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate('/history')}
                  >
                    <div className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      getTaskTypeColor(task.type)
                    )}>
                      {getTaskTypeLabel(task.subType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(task.createdAt)} · {task.outputs.length}个版本
                      </p>
                    </div>
                    <Badge variant={task.status === 'marked' ? 'success' : 'default'} size="sm" dot>
                      {task.status === 'marked' ? '已标记' : '已完成'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TypeDistribution stats={usageStats} />
          <HeatmapCalendar stats={usageStats} />
          
          <Card>
            <CardHeader className="pb-2">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                高转化模板
              </h3>
            </CardHeader>
            <CardContent className="pt-2 space-y-3">
              {topTemplates.slice(0, 3).map((template) => (
                <div key={template.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {template.name}
                    </p>
                    <Badge variant="success" size="sm">
                      {template.conversionRate}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {truncateText(template.content, 60)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    使用 {template.usageCount} 次
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
