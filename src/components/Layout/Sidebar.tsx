import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  Image, 
  Clock, 
  User, 
  Users, 
  Sparkles,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUserStore } from '../../store/useUserStore';
import { Button } from '../ui/Button';

const navItems = [
  { path: '/', label: '场景首页', icon: Home },
  { path: '/product-copy', label: '商品文案', icon: FileText },
  { path: '/customer-service', label: '客服话术', icon: MessageSquare },
  { path: '/image-processing', label: '图片处理', icon: Image },
  { path: '/history', label: '历史任务', icon: Clock },
  { path: '/account', label: '账号中心', icon: User },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useUserStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-900 text-white flex flex-col z-40">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI工具箱</h1>
            <p className="text-xs text-gray-400">电商运营工作台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'animate-pulse')} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </NavLink>
              </li>
            );
          })}
          
          {currentUser?.role === 'manager' && (
            <li>
              <NavLink
                to="/team-management"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  location.pathname === '/team-management'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <Users className="w-5 h-5" />
                <span>团队管理</span>
                {location.pathname === '/team-management' && (
                  <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        {currentUser && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border-2 border-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {currentUser.role === 'manager' ? '主管' : '运营'}
                </p>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={logout}
          className="text-gray-400 hover:text-white hover:bg-gray-800 justify-start"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </Button>
      </div>
    </aside>
  );
};
