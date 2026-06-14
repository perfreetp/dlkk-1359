import React, { useState, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Phone, 
  FileWarning, 
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Copy,
  Star,
  RefreshCw,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../components/ui/Tab';
import { Badge } from '../components/ui/Badge';
import { TaskOutputCard } from '../components/TaskOutputCard';
import { SensitiveWordBadge } from '../components/SensitiveWordBadge';
import { useTaskStore } from '../store/useTaskStore';
import { useUserStore } from '../store/useUserStore';
import { generateBadReviewReply, generateSms, generateCompetitorAnalysis } from '../utils/aiGenerator';
import { detectSensitiveWords } from '../utils/sensitiveWords';
import { useClipboard } from '../hooks/useClipboard';
import { TaskType, TaskSubType, TaskOutput } from '../types';
import { cn } from '../lib/utils';

const activityTemplates = [
  { id: 'new-year', name: '新年特惠', content: '全场满200减30，下单送好礼，新年焕新趁现在！' },
  { id: '618', name: '618大促', content: '618提前购，预售立减50元，前100名享半价！' },
  { id: 'double-11', name: '双11狂欢', content: '双11全球狂欢节，跨店满300减50，限时免单等你抢！' },
];

const CustomerService: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<TaskOutput[]>([]);
  const [showSensitiveWarning, setShowSensitiveWarning] = useState(false);
  const [savedAsTemplate, setSavedAsTemplate] = useState<string | null>(null);
  const { copy, copied } = useClipboard();

  const [badReviewContent, setBadReviewContent] = useState('');
  const [badReviewType, setBadReviewType] = useState('quality');
  const [orderInfo, setOrderInfo] = useState('');

  const [smsContent, setSmsContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [competitorLink, setCompetitorLink] = useState('');
  const [competitorName, setCompetitorName] = useState('');

  const { addTask, tasks } = useTaskStore();
  const { currentUser } = useUserStore();

  const recentTasks = useMemo(() => 
    tasks
      .filter(t => t.type === 'service')
      .slice(0, 3)
  , [tasks]);

  const handleGenerate = async (type: TaskSubType) => {
    setIsGenerating(true);
    setOutputs([]);
    setShowSensitiveWarning(false);
    setSavedAsTemplate(null);

    let taskTitle = '';
    let results: TaskOutput[] = [];
    
    switch (type) {
      case 'bad_review':
        results = await generateBadReviewReply(badReviewContent, badReviewType);
        taskTitle = `差评回复 - ${badReviewType === 'quality' ? '质量问题' : badReviewType === 'logistics' ? '物流问题' : '服务问题'}`;
        break;
      case 'sms':
        const smsText = smsContent || selectedTemplate ? activityTemplates.find(t => t.id === selectedTemplate)?.content || smsContent : '';
        results = await generateSms(smsText, '满减优惠', '2026-06-30', 'friendly');
        taskTitle = `活动短信 - ${smsText?.slice(0, 20) || activityTemplates.find(t => t.id === selectedTemplate)?.name}`;
        break;
      case 'competitor':
        results = await generateCompetitorAnalysis(competitorName);
        taskTitle = `竞品分析 - ${competitorName}`;
        break;
    }

    const outputsWithSensitive = results.map(output => ({
      ...output,
      isMarked: false,
    }));

    setOutputs(outputsWithSensitive);
    
    const hasDanger = outputsWithSensitive.some(o => 
      o.sensitiveWords.some(s => s.level === 'danger')
    );
    setShowSensitiveWarning(hasDanger);

    addTask({
      type: 'service' as TaskType,
      subType: type,
      title: taskTitle,
      inputs: { badReviewContent, badReviewType, orderInfo, smsContent, competitorLink, competitorName },
      outputs: outputsWithSensitive,
      status: hasDanger ? 'warning' : 'completed',
      createdBy: currentUser?.id || '',
      userId: currentUser?.id || '',
    });

    setIsGenerating(false);
  };

  const handleToggleMark = useCallback((outputId: string) => {
    setOutputs(prev => prev.map(o => 
      o.id === outputId ? { ...o, isMarked: !o.isMarked } : o
    ));
  }, []);

  const handleSaveAsTemplate = useCallback((output: TaskOutput) => {
    setSavedAsTemplate(output.id);
    setTimeout(() => setSavedAsTemplate(null), 2000);
  }, []);

  const handleRegenerate = () => {
    const types: TaskSubType[] = ['bad_review', 'sms', 'competitor'];
    handleGenerate(types[activeTab]);
  };

  const canGenerateBadReview = badReviewContent.trim().length > 0;
  const canGenerateSms = smsContent.trim().length > 0 || selectedTemplate;
  const canGenerateCompetitor = competitorName.trim().length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-emerald-600" />
            客服话术
          </h1>
          <p className="text-gray-500 mt-1">智能生成客服回复、活动短信和竞品分析</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                功能选择
              </h3>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onChange={setActiveTab} orientation="vertical">
                <TabList variant="card" className="space-y-2">
                  <Tab className="text-left">
                    <FileWarning className="w-4 h-4" />
                    差评回复
                  </Tab>
                  <Tab className="text-left">
                    <Phone className="w-4 h-4" />
                    活动短信
                  </Tab>
                  <Tab className="text-left">
                    <ShoppingBag className="w-4 h-4" />
                    竞品分析
                  </Tab>
                </TabList>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900">输入信息</h3>
            </CardHeader>
            <CardContent>
              <TabPanels value={activeTab} className="space-y-4">
                <TabPanel className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      差评类型
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'quality', label: '质量' },
                        { id: 'logistics', label: '物流' },
                        { id: 'service', label: '服务' },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setBadReviewType(type.id)}
                          className={cn(
                            'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                            badReviewType === type.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="差评内容"
                    value={badReviewContent}
                    onChange={(e) => setBadReviewContent(e.target.value)}
                    placeholder="粘贴客户的差评内容..."
                    rows={4}
                    required
                  />

                  <Input
                    label="订单信息 (可选)"
                    value={orderInfo}
                    onChange={(e) => setOrderInfo(e.target.value)}
                    placeholder="例如：订单号 #12345，商品xxx"
                  />

                  <Button
                    size="lg"
                    fullWidth
                    loading={isGenerating}
                    disabled={!canGenerateBadReview}
                    onClick={() => handleGenerate('bad_review')}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <Sparkles className="w-4 h-4" />
                    智能生成回复
                  </Button>
                </TabPanel>

                <TabPanel className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择模板
                    </label>
                    <div className="space-y-2">
                      {activityTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setSmsContent(template.content);
                          }}
                          className={cn(
                            'w-full p-3 rounded-lg border text-left transition-all',
                            selectedTemplate === template.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <p className="text-sm font-medium text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{template.content}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="活动内容"
                    value={smsContent}
                    onChange={(e) => setSmsContent(e.target.value)}
                    placeholder="输入活动内容或修改模板..."
                    rows={3}
                  />

                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    短信内容将自动优化成 60 字以内
                  </div>

                  <Button
                    size="lg"
                    fullWidth
                    loading={isGenerating}
                    disabled={!canGenerateSms}
                    onClick={() => handleGenerate('sms')}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <Sparkles className="w-4 h-4" />
                    生成短信文案
                  </Button>
                </TabPanel>

                <TabPanel className="space-y-4">
                  <Input
                    label="竞品名称"
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    placeholder="例如：某品牌同款运动鞋"
                    required
                  />

                  <Input
                    label="竞品链接 (可选)"
                    value={competitorLink}
                    onChange={(e) => setCompetitorLink(e.target.value)}
                    placeholder="粘贴商品链接"
                  />

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-2">分析维度：</p>
                    <div className="flex flex-wrap gap-2">
                      {['价格', '卖点', '评价', '促销', '流量词'].map(tag => (
                        <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    fullWidth
                    loading={isGenerating}
                    disabled={!canGenerateCompetitor}
                    onClick={() => handleGenerate('competitor')}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  >
                    <Sparkles className="w-4 h-4" />
                    提取竞品要点
                  </Button>
                </TabPanel>
              </TabPanels>

              {outputs.length > 0 && (
                <Button
                  variant="outline"
                  fullWidth
                  loading={isGenerating}
                  onClick={handleRegenerate}
                  className="mt-4"
                >
                  <RefreshCw className={cn('w-4 h-4', isGenerating && 'animate-spin')} />
                  换一批
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-4">
          {showSensitiveWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">检测到敏感词风险</p>
                <p className="text-sm text-amber-700 mt-1">
                  部分内容包含违规或敏感词汇，请仔细检查后再使用。
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <h3 className="font-semibold text-gray-900">生成结果</h3>
              {outputs.length > 0 && (
                <div className="flex items-center gap-3">
                  <SensitiveWordBadge outputs={outputs} />
                  <Badge variant="default" size="sm">
                    {outputs.length} 个版本
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {outputs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-gray-500 mb-2">输入左侧信息后点击生成</p>
                  <p className="text-sm text-gray-400">AI 将为您生成多个版本供选择</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outputs.map((output, index) => (
                    <TaskOutputCard
                      key={output.id}
                      output={output}
                      index={index}
                      onToggleMark={handleToggleMark}
                      onSaveAsTemplate={() => handleSaveAsTemplate(output)}
                      onCopy={copy}
                      isSaved={savedAsTemplate === output.id}
                      copied={copied}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {outputs.filter(o => o.isMarked).length > 1 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <h3 className="font-semibold text-gray-900">版本对比</h3>
                <Badge variant="success" size="sm">
                  {outputs.filter(o => o.isMarked).length} 个已标记
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {outputs.filter(o => o.isMarked).map((output, index) => (
                    <div key={output.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="success" size="sm">版本 {index + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copy(output.content)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {output.content}
                      </p>
                      {output.sensitiveWords.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <SensitiveWordBadge outputs={[output]} compact />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900">最近生成</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">暂无记录</p>
              ) : (
                recentTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      {task.subType === 'bad_review' && <FileWarning className="w-4 h-4 text-emerald-600" />}
                      {task.subType === 'sms' && <Phone className="w-4 h-4 text-emerald-600" />}
                      {task.subType === 'competitor' && <ShoppingBag className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.outputs.length} 个版本</p>
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
      </div>
    </div>
  );
};

export default CustomerService;
