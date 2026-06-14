import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useUserStore } from '../store/useUserStore';
import { mockUsers } from '../mock/users';
import { cn } from '../lib/utils';

const Login: React.FC = () => {
  const [email, setEmail] = useState('zhangxiaoming@example.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'operator' | 'manager'>('operator');
  
  const { login, currentUser } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const targetEmail = selectedRole === 'manager' 
      ? 'lijingli@example.com' 
      : 'zhangxiaoming@example.com';
    
    const success = login(targetEmail);
    
    if (success) {
      navigate('/');
    } else {
      setError('登录失败，请检查邮箱和密码');
    }
    
    setIsLoading(false);
  };

  const handleQuickLogin = (role: 'operator' | 'manager') => {
    const targetEmail = role === 'manager' 
      ? 'lijingli@example.com' 
      : 'zhangxiaoming@example.com';
    setEmail(targetEmail);
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI工具箱</h1>
          <p className="text-blue-200">电商运营智能工作台</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">快速选择身份登录：</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickLogin('operator')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    selectedRole === 'operator'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className={cn('font-medium text-sm', selectedRole === 'operator' ? 'text-blue-700' : 'text-gray-700')}>
                    普通运营
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">张小明</p>
                </button>
                <button
                  onClick={() => handleQuickLogin('manager')}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    selectedRole === 'manager'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className={cn('font-medium text-sm', selectedRole === 'manager' ? 'text-amber-700' : 'text-gray-700')}>
                    主管
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">李经理</p>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="邮箱"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                icon={<User className="w-4 h-4" />}
                required
              />
              
              <div className="relative">
                <Input
                  label="密码"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isLoading ? '登录中...' : '登 录'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-center text-gray-500">
                演示账号：运营 zhangxiaoming@example.com / 主管 lijingli@example.com
              </p>
              <p className="text-xs text-center text-gray-400 mt-1">
                密码：任意密码即可登录
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-blue-300/60 text-sm mt-6">
          © 2026 AI工具箱 · 让电商运营更高效
        </p>
      </div>
    </div>
  );
};

export default Login;
