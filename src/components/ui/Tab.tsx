import React, { createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsPropsBase {
  variant?: 'line' | 'card';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

interface TabsPropsWithChildren extends TabsPropsBase {
  value?: number;
  onChange?: (key: number) => void;
  children?: React.ReactNode;
  tabs?: never;
  activeKey?: never;
}

interface TabsPropsWithTabs extends TabsPropsBase {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  value?: never;
  children?: never;
}

type TabsProps = TabsPropsWithChildren | TabsPropsWithTabs;

interface TabsContextType {
  activeIndex: number;
  onChange: (index: number) => void;
  variant: 'line' | 'card';
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  return useContext(TabsContext);
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeKey,
  onChange,
  value,
  variant = 'line',
  orientation = 'horizontal',
  className,
  children,
}) => {
  const [internalValue, setInternalValue] = React.useState(0);
  const activeIndex = value ?? internalValue;
  
  const handleChange = (index: number) => {
    if (value === undefined) {
      setInternalValue(index);
    }
    if (onChange) {
      (onChange as (key: number) => void)(index);
    }
  };

  if (tabs && activeKey !== undefined && onChange) {
    return (
      <div className={cn('w-full', className)}>
        {variant === 'card' ? (
          <div className={cn('inline-flex bg-gray-100 rounded-lg p-1', orientation === 'vertical' && 'flex-col')}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => (onChange as (key: string) => void)(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  activeKey === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className={cn('flex border-b border-gray-200 gap-1', orientation === 'vertical' && 'flex-col border-b-0 border-r')}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => (onChange as (key: string) => void)(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 -mb-px',
                  orientation === 'vertical' && 'border-b-0 border-r-2 -mr-px',
                  activeKey === tab.key
                    ? 'text-blue-700 border-blue-700'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <TabsContext.Provider value={{ activeIndex, onChange: handleChange, variant, orientation }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  variant?: 'line' | 'card';
  className?: string;
  children?: React.ReactNode;
}

export const TabList: React.FC<TabListProps> = ({ variant, className, children }) => {
  const context = useTabsContext();
  const currentVariant = variant || context.variant;
  
  if (currentVariant === 'card') {
    return (
      <div className={cn('inline-flex bg-gray-100 rounded-lg p-1', context.orientation === 'vertical' && 'flex-col', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex border-b border-gray-200 gap-1', context.orientation === 'vertical' && 'flex-col border-b-0 border-r', className)}>
      {children}
    </div>
  );
};

interface TabProps {
  className?: string;
  children?: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ className, children }) => {
  const context = useTabsContext();
  const [index, setIndex] = React.useState(0);
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (ref.current && ref.current.parentElement) {
      const siblings = Array.from(ref.current.parentElement.children);
      setIndex(siblings.indexOf(ref.current));
    }
  }, []);

  return (
    <button
      ref={ref}
      onClick={() => context.onChange(index)}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200',
        context.variant === 'card'
          ? cn(
              'rounded-md',
              context.activeIndex === index
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )
          : cn(
              'border-b-2 -mb-px',
              context.orientation === 'vertical' && 'border-b-0 border-r-2 -mr-px',
              context.activeIndex === index
                ? 'text-blue-700 border-blue-700'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            ),
        className
      )}
    >
      {children}
    </button>
  );
};

interface TabPanelsProps {
  value?: number;
  className?: string;
  children?: React.ReactNode;
}

export const TabPanels: React.FC<TabPanelsProps> = ({ value, className, children }) => {
  const context = useTabsContext();
  let activeIndex = value;
  
  if (activeIndex === undefined && context) {
    activeIndex = context.activeIndex;
  }
  
  if (activeIndex === undefined) {
    activeIndex = 0;
  }
  
  return (
    <div className={cn('w-full', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && index === activeIndex) {
          return child;
        }
        return null;
      })}
    </div>
  );
};

interface TabPanelProps {
  className?: string;
  children?: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ className, children }) => {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
};
