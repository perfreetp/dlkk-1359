import React, { useState, useCallback } from 'react';
import { 
  Sparkles, 
  FileText, 
  Tag, 
  RefreshCw,
  History,
  Star,
  Copy,
  Check,
  AlertCircle,
  BookmarkPlus,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Select, SelectOption } from '../components/ui/Select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../components/ui/Tab';
import { Badge } from '../components/ui/Badge';
import { CategorySelect } from '../components/CategorySelect';
import { TaskOutputCard } from '../components/TaskOutputCard';
import { SensitiveWordBadge } from '../components/SensitiveWordBadge';
import { useTaskStore } from '../store/useTaskStore';
import { useBrandToneStore } from '../store/useBrandToneStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useUserStore } from '../store/useUserStore';
import { generateTitle, generateSellingPoints, generateImageProcessing } from '../utils/aiGenerator';
import { detectSensitiveWords } from '../utils/sensitiveWords';
import { useClipboard } from '../hooks/useClipboard';
import { TaskType, TaskSubType, TaskOutput, Category } from '../types';
import { mockCategories } from '../mock/categories';
import { cn } from '../lib/utils';

const ProductCopy: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [productName, setProductName] = useState('');
  const [sellingPoints, setSellingPoints] = useState('');
  const [outputs, setOutputs] = useState<TaskOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSensitiveWarning, setShowSensitiveWarning] = useState(false);
  const [savedAsTemplate, setSavedAsTemplate] = useState<string | null>(null);

  const { addTask } = useTaskStore();
  const { brandTones, currentToneId, selectedTone } = useBrandToneStore();
  const { addTemplate } = useTemplateStore();
  const { currentUser } = useUserStore();
  const { copy, copied } = useClipboard();

  const findCategoryById = (id: string): Category | null => {
    for (const l1 of mockCategories) {
      for (const l2 of l1.children || []) {
        const l3 = l2.children?.find(c => c.id === id);
        if (l3) return l3;
      }
    }
    return null;
  };

  const handleCategoryChange = (value: string, categoryName: string) => {
    setSelectedCategoryId(value);
    setSelectedCategoryName(categoryName);
    if (value) {
      const category = findCategoryById(value);
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  };

  const handleGenerateTitle = async () => {
    if (!selectedCategory || !productName) return;
    
    setIsGenerating(true);
    setOutputs([]);
    setShowSensitiveWarning(false);
    setSavedAsTemplate(null);

    const results = await generateTitle(productName, selectedCategory, selectedTone?.style);
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
      type: 'product' as TaskType,
      subType: 'title' as TaskSubType,
      title: `标题生成 - ${productName}`,
      category: selectedCategory.name,
      inputs: { productName, categoryId: selectedCategory.id },
      outputs: outputsWithSensitive,
      status: hasDanger ? 'warning' : 'completed',
      createdBy: currentUser?.id || '',
      userId: currentUser?.id || '',
    });

    setIsGenerating(false);
  };

  const handleGenerateSellingPoints = async () => {
    if (!selectedCategory || !productName) return;
    
    setIsGenerating(true);
    setOutputs([]);
    setShowSensitiveWarning(false);
    setSavedAsTemplate(null);

    const results = await generateSellingPoints(
      productName, 
      sellingPoints.split(/[,，\n]/).filter(s => s.trim()),
      selectedTone?.style
    );
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
      type: 'product' as TaskType,
      subType: 'selling_point' as TaskSubType,
      title: `卖点生成 - ${productName}`,
      category: selectedCategory.name,
      inputs: { productName, sellingPoints, categoryId: selectedCategory.id },
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
    const template = addTemplate({
      name: `${productName} - ${selectedTone?.name}`,
      content: output.content,
      type: activeTab === 0 ? 'title' as TaskSubType : 'selling_point' as TaskSubType,
      toneId: currentToneId,
      categoryId: selectedCategory?.id,
    });
    setSavedAsTemplate(output.id);
    setTimeout(() => setSavedAsTemplate(null), 2000);
  }, [productName, selectedTone, currentToneId, selectedCategory, activeTab, addTemplate]);

  const handleRegenerate = () => {
    if (activeTab === 0) {
      handleGenerateTitle();
    } else {
      handleGenerateSellingPoints();
    }
  };

  const hasInputs = selectedCategory && productName;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            商品文案
          </h1>
          <p className="text-gray-500 mt-1">智能生成商品标题和卖点，提升搜索排名和转化率</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" size="sm" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            本周生成 28 次
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                商品信息
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <CategorySelect 
                value={selectedCategoryId} 
                onChange={handleCategoryChange} 
              />
              
              <Input
                label="商品名称"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="例如：夏季透气运动鞋"
                required
              />

              {activeTab === 1 && (
                <Textarea
                  label="现有卖点"
                  value={sellingPoints}
                  onChange={(e) => setSellingPoints(e.target.value)}
                  placeholder="输入需要改写的卖点，多个卖点用逗号或换行分隔"
                  rows={4}
                  hint="AI将基于这些内容进行优化和扩展"
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  品牌语气
                </label>
                <div className="space-y-2">
                  {brandTones.map(tone => (
                    <button
                      key={tone.id}
                      onClick={() => useBrandToneStore.getState().setCurrentTone(tone.id)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all',
                        currentToneId === tone.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          'font-medium text-sm',
                          currentToneId === tone.id ? 'text-blue-700' : 'text-gray-700'
                        )}>
                          {tone.name}
                        </p>
                        {currentToneId === tone.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{tone.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                fullWidth
                loading={isGenerating}
                disabled={!hasInputs}
                onClick={activeTab === 0 ? handleGenerateTitle : handleGenerateSellingPoints}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? '生成中...' : `智能生成${activeTab === 0 ? '标题' : '卖点'}`}
              </Button>

              {outputs.length > 0 && (
                <Button
                  variant="outline"
                  fullWidth
                  loading={isGenerating}
                  onClick={handleRegenerate}
                >
                  <RefreshCw className={cn('w-4 h-4', isGenerating && 'animate-spin')} />
                  换一批
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                快捷提示
              </h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                标题建议包含品牌、核心词、属性词
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                卖点要突出产品差异化优势
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                选择合适的语气匹配目标人群
              </p>
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
            <Tabs value={activeTab} onChange={setActiveTab}>
              <CardHeader className="pb-0">
                <TabList variant="line">
                  <Tab>
                    <Sparkles className="w-4 h-4" />
                    标题生成
                  </Tab>
                  <Tab>
                    <RefreshCw className="w-4 h-4" />
                    卖点改写
                  </Tab>
                </TabList>
              </CardHeader>
              <CardContent className="pt-6">
                <TabPanels>
                <TabPanel>
                  {outputs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-gray-500 mb-2">选择类目并输入商品名称</p>
                      <p className="text-sm text-gray-400">AI 将为您生成 3-5 个优化标题</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          共生成 {outputs.length} 个版本
                        </p>
                        <SensitiveWordBadge outputs={outputs} />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
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
                    </div>
                  )}
                </TabPanel>

                <TabPanel>
                  {outputs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <RefreshCw className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-gray-500 mb-2">输入现有卖点，选择品牌语气</p>
                      <p className="text-sm text-gray-400">AI 将为您批量改写和优化卖点</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          共生成 {outputs.length} 个版本
                        </p>
                        <SensitiveWordBadge outputs={outputs} />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
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
                    </div>
                  )}
                </TabPanel>
              </TabPanels>
              </CardContent>
            </Tabs>
          </Card>

          {outputs.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <h3 className="font-semibold text-gray-900">版本对比</h3>
                <Badge variant="default" size="sm">
                  {outputs.filter(o => o.isMarked).length} 个已标记
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {outputs.filter(o => o.isMarked).length === 0 ? (
                    <div className="col-span-3 text-center py-8">
                      <p className="text-sm text-gray-500">点击卡片上的「标记」按钮，选择想要对比的版本</p>
                    </div>
                  ) : (
                    outputs.filter(o => o.isMarked).map((output, index) => (
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
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {output.content}
                        </p>
                        {output.sensitiveWords.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <SensitiveWordBadge outputs={[output]} compact />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCopy;
