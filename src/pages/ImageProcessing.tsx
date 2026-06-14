import React, { useState, useCallback, useRef } from 'react';
import { 
  Image, 
  Upload, 
  Crop, 
  Palette,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  X,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { TaskOutputCard } from '../components/TaskOutputCard';
import { SensitiveWordBadge } from '../components/SensitiveWordBadge';
import { useTaskStore } from '../store/useTaskStore';
import { useUserStore } from '../store/useUserStore';
import { generateImageProcessing } from '../utils/aiGenerator';
import { useClipboard } from '../hooks/useClipboard';
import { TaskType, TaskSubType, TaskOutput } from '../types';
import { cn } from '../lib/utils';

const platformSizes = [
  { id: 'taobao', name: '淘宝主图', size: '800×800px' },
  { id: 'tmall', name: '天猫详情', size: '750×1000px' },
  { id: 'jd', name: '京东主图', size: '800×800px' },
  { id: 'pdd', name: '拼多多', size: '750×1334px' },
  { id: 'douyin', name: '抖音小店', size: '600×600px' },
  { id: 'xiaohongshu', name: '小红书', size: '1080×1440px' },
];

const backgroundStyles = [
  { id: 'white', name: '纯白背景', color: '#FFFFFF' },
  { id: 'gradient', name: '渐变背景', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'lifestyle', name: '生活场景', color: '#F5F5DC' },
  { id: 'minimal', name: '简约纯色', color: '#F8FAFC' },
  { id: 'brand', name: '品牌主题', color: '#1E40AF' },
];

const ImageProcessing: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('taobao');
  const [selectedBackground, setSelectedBackground] = useState<string>('white');
  const [watermarkText, setWatermarkText] = useState('');
  const [outputs, setOutputs] = useState<TaskOutput[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedAsTemplate, setSavedAsTemplate] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copy, copied } = useClipboard();
  const { addTask } = useTaskStore();
  const { currentUser } = useUserStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    
    setIsGenerating(true);
    setOutputs([]);
    setSavedAsTemplate(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const platform = platformSizes.find(p => p.id === selectedPlatform);
    const background = backgroundStyles.find(b => b.id === selectedBackground);
    const results = await generateImageProcessing(platform?.name || '', {
      platform: selectedPlatform,
      background: selectedBackground,
      watermark: watermarkText,
    });
    
    const outputsWithSensitive = results.map(output => ({
      ...output,
      isMarked: false,
      imageUrl: uploadedImage,
    }));

    setOutputs(outputsWithSensitive);

    addTask({
      type: 'image' as TaskType,
      subType: 'background' as TaskSubType,
      title: `图片处理 - ${platform?.name}`,
      inputs: { platform: selectedPlatform, background: selectedBackground, watermark: watermarkText },
      outputs: outputsWithSensitive,
      status: 'completed',
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

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setOutputs([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const platform = platformSizes.find(p => p.id === selectedPlatform);
  const background = backgroundStyles.find(b => b.id === selectedBackground);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Image className="w-7 h-7 text-purple-600" />
            图片处理
          </h1>
          <p className="text-gray-500 mt-1">智能更换背景、裁剪尺寸，一键适配多平台</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" size="sm">
            本周处理 12 次
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" />
                上传图片
              </h3>
            </CardHeader>
            <CardContent>
              {!uploadedImage ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                    isDragging
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-400 hover:bg-gray-50'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {isDragging ? '松开上传图片' : '点击或拖拽上传'}
                  </p>
                  <p className="text-xs text-gray-500">支持 JPG、PNG、WEBP 格式</p>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white z-10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img
                    src={uploadedImage}
                    alt="上传预览"
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Crop className="w-4 h-4 text-purple-600" />
                平台尺寸
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {platformSizes.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      selectedPlatform === p.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p className={cn(
                      'text-sm font-medium',
                      selectedPlatform === p.id ? 'text-purple-700' : 'text-gray-700'
                    )}>
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500">{p.size}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                背景风格
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {backgroundStyles.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg.id)}
                  className={cn(
                    'w-full p-3 rounded-lg border flex items-center gap-3 transition-all',
                    selectedBackground === bg.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0"
                    style={{ background: bg.color }}
                  />
                  <span className={cn(
                    'text-sm font-medium',
                    selectedBackground === bg.id ? 'text-purple-700' : 'text-gray-700'
                  )}>
                    {bg.name}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-4">
              <Input
                label="水印文字 (可选)"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="例如：品牌官方旗舰店"
              />

              <Button
                size="lg"
                fullWidth
                loading={isGenerating}
                disabled={!uploadedImage}
                onClick={handleGenerate}
                className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? '生成中...' : '智能处理'}
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
        </div>

        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <h3 className="font-semibold text-gray-900">处理结果</h3>
              {outputs.length > 0 && (
                <Badge variant="default" size="sm">
                  {outputs.length} 个版本
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {outputs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-500 mb-2">上传图片并选择处理参数</p>
                  <p className="text-sm text-gray-400">AI 将为您生成多个处理方案</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outputs.map((output, index) => (
                    <div
                      key={output.id}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        output.isMarked
                          ? 'border-green-500 bg-green-50/50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="w-40 h-40 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {output.imageUrl && (
                            <img
                              src={output.imageUrl}
                              alt={`方案 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div 
                            className="absolute inset-0 mix-blend-overlay opacity-30"
                            style={{ background: background?.color }}
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant={output.isMarked ? 'success' : 'default'} size="sm">
                              方案 {index + 1}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            {output.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" size="sm">
                              {platform?.name} {platform?.size}
                            </Badge>
                            <Badge variant="default" size="sm">
                              {background?.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copy(output.content)}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              复制参数
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Download className="w-3.5 h-3.5" />
                              下载
                            </Button>
                            <Button
                              size="sm"
                              variant={output.isMarked ? 'success' : 'ghost'}
                              onClick={() => handleToggleMark(output.id)}
                            >
                              {output.isMarked ? (
                                <><Check className="w-3.5 h-3.5" /> 已标记</>
                              ) : (
                                '标记'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {outputs.filter(o => o.isMarked).length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <h3 className="font-semibold text-gray-900">对比选择</h3>
                <Badge variant="success" size="sm">
                  {outputs.filter(o => o.isMarked).length} 个已标记
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {outputs.filter(o => o.isMarked).map((output, index) => (
                    <div key={output.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="aspect-square rounded-lg overflow-hidden mb-3 relative">
                        {output.imageUrl && (
                          <img
                            src={output.imageUrl}
                            alt={`对比 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div 
                          className="absolute inset-0 mix-blend-overlay opacity-30"
                          style={{ background: background?.color }}
                        />
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{output.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageProcessing;
