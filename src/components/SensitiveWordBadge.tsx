import React from 'react';
import type { SensitiveWord, TaskOutput } from '../types';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SensitiveWordBadgeProps {
  sensitiveWords?: SensitiveWord[];
  outputs?: TaskOutput[];
  showTooltip?: boolean;
  compact?: boolean;
  className?: string;
}

export const SensitiveWordBadge: React.FC<SensitiveWordBadgeProps> = ({
  sensitiveWords,
  outputs,
  showTooltip = true,
  compact = false,
  className,
}) => {
  let allSensitiveWords: SensitiveWord[] = sensitiveWords || [];
  
  if (outputs && outputs.length > 0) {
    allSensitiveWords = outputs.flatMap(o => o.sensitiveWords);
  }

  if (allSensitiveWords.length === 0) return null;

  const dangerCount = allSensitiveWords.filter(w => w.level === 'danger').length;
  const warningCount = allSensitiveWords.filter(w => w.level === 'warning').length;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {dangerCount > 0 && (
        <div className="group relative">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium',
            compact && 'px-1.5 py-0.5 text-[10px]'
          )}>
            <AlertCircle className={cn('w-3.5 h-3.5', compact && 'w-3 h-3')} />
            {dangerCount}个违规词
          </span>
          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
              {allSensitiveWords.filter(w => w.level === 'danger').map((w, i) => (
                <div key={i} className="mb-1 last:mb-0">
                  <span className="font-semibold text-red-300">「{w.word}」</span>
                  <span className="text-gray-300">: {w.suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {warningCount > 0 && (
        <div className="group relative">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium',
            compact && 'px-1.5 py-0.5 text-[10px]'
          )}>
            <AlertTriangle className={cn('w-3.5 h-3.5', compact && 'w-3 h-3')} />
            {warningCount}个提示词
          </span>
          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
              {allSensitiveWords.filter(w => w.level === 'warning').map((w, i) => (
                <div key={i} className="mb-1 last:mb-0">
                  <span className="font-semibold text-yellow-300">「{w.word}」</span>
                  <span className="text-gray-300">: {w.suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
