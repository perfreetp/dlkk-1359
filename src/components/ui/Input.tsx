import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  hint,
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
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200',
            icon && 'pl-10',
            error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400',
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  hint,
  className,
  rows = 4,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-all duration-200',
          error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export { TextArea as Textarea };
