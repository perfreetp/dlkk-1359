import React, { useState, useMemo } from 'react';
import { 
  User, 
  Settings, 
  Star, 
  BarChart3,
  Palette,
  Shield,
  LogOut,
  Trash2,
  Edit3,
  Check,
  Plus,
  TrendingUp,
  Zap,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../components/ui/Tab';
import { WeeklyBarChart, TypeDistribution, HeatmapCalendar } from '../components/StatsChart';
import { useUserStore } from '../store/useUserStore';
import { useTaskStore } from '../store/useTaskStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useBrandToneStore } from '../store/useBrandToneStore';
import { getTaskTypeLabel } from '../utils/formatters';
import { cn } from '../lib/utils';

const Account: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [editToneId, setEditToneId] = useState<string | null>(null);
  const [editToneName, setEditToneName] = useState('');
  const [editToneDesc, setEditToneDesc] = useState('');
  const [editToneStyle, setEditToneStyle] = useState('');

  const { currentUser, logout } = useUserStore();
  const { usageStats, tasks } = useTaskStore();
  const { templates, favoriteTemplates, toggleFavorite, deleteTemplate } = useTemplateStore();
  const { brandTones, currentToneId, setCurrentTone, addBrandTone, updateBrandTone, deleteBrandTone } = useBrandToneStore();

  const totalUsage = useMemo(() => 
    usageStats.reduce((sum, s) => sum + s.count, 0), 
  [usageStats]);

  const handleEditTone = (tone: typeof brandTones[0]) => {
    setEditToneId(tone.id);
    setEditToneName(tone.name);
    setEditToneDesc(tone.description);
    setEditToneStyle(tone.style);
  };

  const handleSaveTone = () => {
    if (editToneId) {
      updateBrandTone(editToneId, {
        name: editToneName,
        description: editToneDesc,
        style: editToneStyle,
      });
    } else {
      addBrandTone({
        name: editToneName,
        description: editToneDesc,
        style: editToneStyle,
      });
    }
    setEditToneId(null);
    setEditToneName('');
    setEditToneDesc('');
    setEditToneStyle('');
  };

  const handleCancelEdit = () => {
    setEditToneId(null);
    setEditToneName('');
    setEditToneDesc('');
    setEditToneStyle('');
  };

  const handleAddNewTone = () => {
    setEditToneId('new');
    setEditToneName('');
    setEditToneDesc('');
    setEditToneStyle('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-7 h-7 text-rose-600" />
            账号中心
          </h1>
          <p className="text-gray-500 mt-1">管理您的个人信息、品牌语气和使用统计</p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="w-4 h-4" />
          退出登录
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {currentUser?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
              <p className="text-gray-500">{currentUser?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={currentUser?.role === 'manager' ? 'amber' : 'default'}>
                  {currentUser?.role === 'manager' ? '主管' : '运营'}
                </Badge>
                <span className="text-sm text-gray-500">
                  所属团队：{currentUser?.team}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalUsage}</p>
                <p className="text-xs text-gray-500">本周使用</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                <p className="text-xs text-gray-500">总任务数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{favoriteTemplates.length}</p>
                <p className="text-xs text-gray-500">收藏模板</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList variant="line">
              <Tab>
                <BarChart3 className="w-4 h-4" />
                使用统计
              </Tab>
              <Tab>
                <Palette className="w-4 h-4" />
                品牌语气
              </Tab>
              <Tab>
                <Star className="w-4 h-4" />
                模板收藏
              </Tab>
              <Tab>
                <Settings className="w-4 h-4" />
                账号设置
              </Tab>
            </TabList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          <TabPanels value={activeTab}>
            <TabPanel>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <WeeklyBarChart stats={usageStats} />
                  <HeatmapCalendar stats={usageStats} />
                </div>
                <div className="space-y-6">
                  <TypeDistribution stats={usageStats} />
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        快捷功能
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-2">
                      <Button variant="outline" fullWidth className="justify-start">
                        <FileText className="w-4 h-4" />
                        导出使用报告
                      </Button>
                      <Button variant="outline" fullWidth className="justify-start">
                        <TrendingUp className="w-4 h-4" />
                        查看效率分析
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">品牌语气管理</h3>
                    <p className="text-sm text-gray-500 mt-1">设置您的品牌专属语气风格，生成内容更统一</p>
                  </div>
                  <Button onClick={handleAddNewTone}>
                    <Plus className="w-4 h-4" />
                    新增语气
                  </Button>
                </div>

                {editToneId && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-medium text-gray-900">
                        {editToneId === 'new' ? '新增品牌语气' : '编辑品牌语气'}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="语气名称"
                          value={editToneName}
                          onChange={(e) => setEditToneName(e.target.value)}
                          placeholder="例如：专业商务"
                        />
                        <Input
                          label="风格标签"
                          value={editToneStyle}
                          onChange={(e) => setEditToneStyle(e.target.value)}
                          placeholder="例如：正式、严谨、高端"
                        />
                      </div>
                      <Textarea
                        label="语气描述"
                        value={editToneDesc}
                        onChange={(e) => setEditToneDesc(e.target.value)}
                        placeholder="详细描述这种语气的特点和适用场景..."
                        rows={2}
                      />
                      <div className="flex items-center gap-2">
                        <Button onClick={handleSaveTone} disabled={!editToneName || !editToneDesc}>
                          <Check className="w-4 h-4" />
                          保存
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          取消
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {brandTones.map(tone => (
                    <div
                      key={tone.id}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all relative',
                        currentToneId === tone.id
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      )}
                    >
                      {currentToneId === tone.id && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="success" size="sm">当前使用</Badge>
                        </div>
                      )}
                      <h4 className="font-semibold text-gray-900 mb-1">{tone.name}</h4>
                      <p className="text-sm text-gray-500 mb-3">{tone.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tone.style.split(/[,，]/).map((tag, i) => (
                          <Badge key={i} variant="default" size="sm">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        {currentToneId !== tone.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentTone(tone.id)}
                          >
                            设为默认
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTone(tone)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        {tone.id !== 'tone-1' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteBrandTone(tone.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>

            <TabPanel>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">收藏的模板</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      共收藏 {favoriteTemplates.length} 个高转化模板
                    </p>
                  </div>
                </div>

                {favoriteTemplates.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-amber-300" />
                    </div>
                    <p className="text-gray-500 mb-2">暂无收藏模板</p>
                    <p className="text-sm text-gray-400">在生成结果中点击「收藏」按钮保存高转化模板</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {favoriteTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {getTaskTypeLabel(template.type)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="success" size="sm">
                              {template.conversionRate}%
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFavorite(template.id)}
                              className="text-amber-500"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTemplate(template.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                          {template.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>使用 {template.usageCount} 次</span>
                          <span>收藏于 {new Date(template.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            <TabPanel>
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">个人信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="姓名"
                      value={currentUser?.name || ''}
                      onChange={() => {}}
                      disabled
                    />
                    <Input
                      label="邮箱"
                      value={currentUser?.email || ''}
                      onChange={() => {}}
                      disabled
                    />
                    <Input
                      label="角色"
                      value={currentUser?.role === 'manager' ? '主管' : '运营'}
                      onChange={() => {}}
                      disabled
                    />
                    <Input
                      label="团队"
                      value={currentUser?.team || ''}
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    安全设置
                  </h3>
                  <div className="space-y-3">
                    <Button variant="outline" fullWidth className="justify-start">
                      修改密码
                    </Button>
                    <Button variant="outline" fullWidth className="justify-start">
                      绑定手机
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">数据管理</h3>
                  <div className="space-y-3">
                    <Button variant="outline" fullWidth className="justify-start">
                      导出个人数据
                    </Button>
                    <Button 
                      variant="outline" 
                      fullWidth 
                      className="justify-start text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                      清除所有历史记录
                    </Button>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
