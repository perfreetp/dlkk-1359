import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-gray-900 appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200',
            error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '输入后按回车添加',
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="min-h-[48px] px-3 py-2 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:text-blue-900 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-0.5"
          />
        </div>
      </div>
    </div>
  );
};
