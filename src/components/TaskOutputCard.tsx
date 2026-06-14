import React from 'react';
import type { TaskOutput } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SensitiveWordBadge } from './SensitiveWordBadge';
import { Copy, Check, CheckCircle2, Circle, BookmarkPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { highlightSensitiveWords } from '../utils/sensitiveWords';
import { useClipboard } from '../hooks/useClipboard';

interface TaskOutputCardProps {
  output: TaskOutput;
  index?: number;
  onMark?: (outputId: string) => void;
  onToggleMark?: (outputId: string) => void;
  onSaveAsTemplate?: (output: TaskOutput) => void;
  onCopy?: (text: string, id?: string) => void;
  isSaved?: boolean;
  copied?: boolean;
  showMark?: boolean;
  showCopy?: boolean;
  className?: string;
}

export const TaskOutputCard: React.FC<TaskOutputCardProps> = ({
  output,
  index,
  onMark,
  onToggleMark,
  onSaveAsTemplate,
  onCopy,
  isSaved,
  copied: externalCopied,
  showMark = true,
  showCopy = true,
  className,
}) => {
  const { copiedId, copy } = useClipboard();
  const isCopied = externalCopied !== undefined ? externalCopied : copiedId === output.id;
  const handleMark = onToggleMark || onMark;

  const handleCopy = async () => {
    if (onCopy) {
      await onCopy(output.content, output.id);
    } else {
      await copy(output.content, output.id);
    }
  };

  const highlightedContent = highlightSensitiveWords(output.content, output.sensitiveWords);

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        output.isMarked && 'ring-2 ring-green-500 border-green-300',
        className
      )}
    >
      {output.isMarked && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-0.5 text-xs font-medium rounded-bl-lg">
          已选用
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {index !== undefined && (
              <span className="text-xs font-medium text-gray-500">
                #{index + 1}
              </span>
            )}
            <span className="text-xs font-medium text-gray-500">
              版本 {output.version || index !== undefined ? index + 1 : 1}
            </span>
            <SensitiveWordBadge sensitiveWords={output.sensitiveWords} />
          </div>
          <div className="flex items-center gap-1">
            {showCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="gap-1"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制
                  </>
                )}
              </Button>
            )}
            {onSaveAsTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSaveAsTemplate(output)}
                className={cn(
                  'gap-1',
                  isSaved && 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                )}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    已保存
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    存为模板
                  </>
                )}
              </Button>
            )}
            {showMark && handleMark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMark(output.id)}
                className={cn(
                  'gap-1',
                  output.isMarked && 'text-green-600 bg-green-50 hover:bg-green-100'
                )}
              >
                {output.isMarked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    已标记
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    标记可用
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          <div 
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
            className="[&_.sensitive-danger]:bg-red-100 [&_.sensitive-danger]:text-red-700 [&_.sensitive-danger]:px-1 [&_.sensitive-danger]:rounded [&_.sensitive-danger]:border-b-2 [&_.sensitive-danger]:border-red-400 [&_.sensitive-warning]:bg-yellow-100 [&_.sensitive-warning]:text-yellow-700 [&_.sensitive-warning]:px-1 [&_.sensitive-warning]:rounded [&_.sensitive-warning]:border-b-2 [&_.sensitive-warning]:border-yellow-400"
          />
        </div>
      </div>
    </Card>
  );
};
