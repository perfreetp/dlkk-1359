import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Search, 
  Filter,
  Star,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../components/ui/Tab';
import { Badge } from '../components/ui/Badge';
import { SensitiveWordBadge } from '../components/SensitiveWordBadge';
import { useTaskStore } from '../store/useTaskStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useClipboard } from '../hooks/useClipboard';
import { Task, TaskType } from '../types';
import { getTaskTypeLabel, getTaskTypeColor, formatDate } from '../utils/formatters';
import { cn } from '../lib/utils';

const typeFilters = [
  { id: 'all', label: '全部' },
  { id: 'product', label: '商品文案' },
  { id: 'service', label: '客服话术' },
  { id: 'image', label: '图片处理' },
];

const statusFilters = [
  { id: 'all', label: '全部状态' },
  { id: 'completed', label: '已完成' },
  { id: 'marked', label: '已标记' },
  { id: 'warning', label: '有风险' },
];

const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [markAsTemplateSuccess, setMarkAsTemplateSuccess] = useState<string | null>(null);

  const { tasks, deleteTask, updateTaskOutput } = useTaskStore();
  const { addTemplate } = useTemplateStore();
  const { copy, copied } = useClipboard();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || task.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [tasks, searchQuery, typeFilter, statusFilter]);

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {
      product: [],
      service: [],
      image: [],
    };
    filteredTasks.forEach(task => {
      groups[task.type]?.push(task);
    });
    return groups;
  }, [filteredTasks]);

  const handleToggleExpand = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleToggleMark = (taskId: string, outputId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const output = task.outputs.find(o => o.id === outputId);
    if (!output) return;

    updateTaskOutput(taskId, outputId, { isMarked: !output.isMarked });
    
    const allMarked = task.outputs
      .filter(o => o.id !== outputId)
      .every(o => o.isMarked);
    const anyMarked = task.outputs.some(o => o.isMarked || o.id === outputId);
    
    if (!output.isMarked && (anyMarked || !allMarked)) {
      useTaskStore.getState().updateTask(taskId, { status: 'marked' });
    } else if (output.isMarked && !anyMarked) {
      useTaskStore.getState().updateTask(taskId, { status: 'completed' });
    }
  };

  const handleSaveAsTemplate = (task: Task, outputId: string) => {
    const output = task.outputs.find(o => o.id === outputId);
    if (!output) return;

    addTemplate({
      name: task.title,
      content: output.content,
      type: task.subType,
    });
    setMarkAsTemplateSuccess(outputId);
    setTimeout(() => setMarkAsTemplateSuccess(null), 2000);
  };

  const handleDelete = (taskId: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteTask(taskId);
      if (expandedTask === taskId) {
        setExpandedTask(null);
      }
    }
  };

  const hasDanger = (task: Task) => 
    task.outputs.some(o => o.sensitiveWords.some(s => s.level === 'danger'));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-7 h-7 text-amber-600" />
            历史任务
          </h1>
          <p className="text-gray-500 mt-1">查看和管理所有生成记录，对比多版输出</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" size="sm">
            共 {tasks.length} 条记录
          </Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索任务名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'border-blue-500 bg-blue-50')}
            >
              <Filter className="w-4 h-4" />
              筛选
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setTypeFilter(filter.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        typeFilter === filter.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务状态
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        statusFilter === filter.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList variant="line">
              <Tab>
                <Clock className="w-4 h-4" />
                按时间
              </Tab>
              <Tab>
                <Star className="w-4 h-4" />
                按类型
              </Tab>
            </TabList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <TabPanels value={activeTab}>
            <TabPanel>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-2">暂无任务记录</p>
                  <p className="text-sm text-gray-400">开始使用功能后，记录将显示在这里</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className={cn(
                        'border rounded-xl transition-all overflow-hidden',
                        task.status === 'warning' ? 'border-amber-200' :
                        task.status === 'marked' ? 'border-green-200' :
                        'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <div
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleToggleExpand(task.id)}
                      >
                        <div className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0',
                          getTaskTypeColor(task.type)
                        )}>
                          {getTaskTypeLabel(task.subType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{task.title}</p>
                            {hasDanger(task) && (
                              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{formatDate(task.createdAt)}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">{task.outputs.length} 个版本</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.status === 'warning' && (
                            <Badge variant="warning" size="sm" dot>
                              有风险
                            </Badge>
                          )}
                          {task.status === 'marked' && (
                            <Badge variant="success" size="sm" dot>
                              已标记
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {expandedTask === task.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedTask === task.id && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              {task.outputs.length} 个生成版本
                            </p>
                            <SensitiveWordBadge outputs={task.outputs} />
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {task.outputs.map((output, index) => (
                              <div
                                key={output.id}
                                className={cn(
                                  'p-4 bg-white rounded-lg border-2 transition-all',
                                  output.isMarked
                                    ? 'border-green-500 bg-green-50/30'
                                    : 'border-gray-100'
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={output.isMarked ? 'success' : 'default'} size="sm">
                                      版本 {index + 1}
                                    </Badge>
                                    {output.sensitiveWords.length > 0 && (
                                      <SensitiveWordBadge outputs={[output]} compact />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copy(output.content);
                                      }}
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleMark(task.id, output.id);
                                      }}
                                    >
                                      {output.isMarked ? (
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                      ) : (
                                        <Star className="w-3.5 h-3.5 text-gray-400" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveAsTemplate(task, output.id);
                                      }}
                                    >
                                      {markAsTemplateSuccess === output.id ? (
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                      ) : (
                                        <Star className="w-3.5 h-3.5 text-amber-400" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {output.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabPanel>

            <TabPanel>
              {Object.entries(groupedTasks).every(([_, list]) => list.length === 0) ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-2">暂无任务记录</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(['product', 'service', 'image'] as TaskType[]).map(type => {
                    const typeTasks = groupedTasks[type] || [];
                    if (typeTasks.length === 0) return null;

                    return (
                      <div key={type}>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            type === 'product' ? 'bg-blue-500' :
                            type === 'service' ? 'bg-emerald-500' :
                            'bg-purple-500'
                          )} />
                          {type === 'product' ? '商品文案' : type === 'service' ? '客服话术' : '图片处理'}
                          <Badge variant="default" size="sm">{typeTasks.length}</Badge>
                        </h3>
                        <div className="space-y-2">
                          {typeTasks.map(task => (
                            <div
                              key={task.id}
                              className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all flex items-center gap-4 cursor-pointer"
                              onClick={() => handleToggleExpand(task.id)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{task.title}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(task.createdAt)} · {task.outputs.length} 个版本
                                </p>
                              </div>
                              <Badge
                                variant={task.status === 'marked' ? 'success' : task.status === 'warning' ? 'warning' : 'default'}
                                size="sm"
                                dot
                              >
                                {task.status === 'marked' ? '已标记' : task.status === 'warning' ? '有风险' : '已完成'}
                              </Badge>
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabPanel>
          </TabPanels>
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
