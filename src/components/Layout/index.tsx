import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUserStore } from '../../store/useUserStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useTemplateStore } from '../../store/useTemplateStore';
import { useBrandToneStore } from '../../store/useBrandToneStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, init: initUser } = useUserStore();
  const { init: initTasks } = useTaskStore();
  const { init: initTemplates } = useTemplateStore();
  const { init: initBrandTones } = useBrandToneStore();

  useEffect(() => {
    initUser();
  }, [initUser]);

  useEffect(() => {
    if (currentUser) {
      initTasks(currentUser.id);
      initTemplates();
      initBrandTones();
    }
  }, [currentUser, initTasks, initTemplates, initBrandTones]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6">
          <div className="max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
