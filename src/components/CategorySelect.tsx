import React, { useState, useMemo } from 'react';
import type { Category } from '../types';
import { mockCategories } from '../mock/categories';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface CategorySelectProps {
  value?: string;
  onChange: (value: string, categoryName: string) => void;
  className?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  className,
}) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedLevel1, setSelectedLevel1] = useState<string | null>(null);
  const [selectedLevel2, setSelectedLevel2] = useState<string | null>(null);

  const level2Categories = useMemo(() => {
    if (!selectedLevel1) return [];
    const level1 = mockCategories.find(c => c.id === selectedLevel1);
    return level1?.children || [];
  }, [selectedLevel1]);

  const level3Categories = useMemo(() => {
    if (!selectedLevel2) return [];
    const level2 = level2Categories.find(c => c.id === selectedLevel2);
    return level2?.children || [];
  }, [selectedLevel2, level2Categories]);

  const handleLevel1Select = (category: Category) => {
    setSelectedLevel1(category.id);
    setSelectedLevel2(null);
    setLevel(2);
  };

  const handleLevel2Select = (category: Category) => {
    setSelectedLevel2(category.id);
    setLevel(3);
  };

  const handleLevel3Select = (category: Category) => {
    onChange(category.id, category.name);
  };

  const getSelectedName = (): string => {
    if (!value) return '';
    for (const l1 of mockCategories) {
      for (const l2 of l1.children || []) {
        const l3 = l2.children?.find(c => c.id === value);
        if (l3) return `${l1.name} / ${l2.name} / ${l3.name}`;
      }
    }
    return '';
  };

  return (
    <div className={cn('w-full', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        商品类目
      </label>
      
      {value ? (
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-900">{getSelectedName()}</span>
          <button
            onClick={() => {
              onChange('', '');
              setLevel(1);
              setSelectedLevel1(null);
              setSelectedLevel2(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            重新选择
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="flex border-b border-gray-200">
            {[1, 2, 3].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l as 1 | 2 | 3)}
                className={cn(
                  'flex-1 px-4 py-2.5 text-sm font-medium transition-colors',
                  level === l
                    ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {l === 1 && '一级类目'}
                {l === 2 && '二级类目'}
                {l === 3 && '三级类目'}
              </button>
            ))}
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2">
            {level === 1 && mockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleLevel1Select(category)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                  selectedLevel1 === category.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <span className="text-sm">{category.name}</span>
                <div className="flex items-center gap-1">
                  {selectedLevel1 === category.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
            
            {level === 2 && (selectedLevel1 ? (
              level2Categories.length > 0 ? (
                level2Categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleLevel2Select(category)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                      selectedLevel2 === category.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <span className="text-sm">{category.name}</span>
                    <div className="flex items-center gap-1">
                      {selectedLevel2 === category.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">暂无二级类目</p>
              )
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">请先选择一级类目</p>
            ))}
            
            {level === 3 && (selectedLevel2 ? (
              level3Categories.length > 0 ? (
                level3Categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleLevel3Select(category)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                      value === category.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <span className="text-sm">{category.name}</span>
                    {value === category.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">暂无三级类目</p>
              )
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">请先选择二级类目</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
