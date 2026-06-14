import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import ProductCopy from './pages/ProductCopy';
import CustomerService from './pages/CustomerService';
import ImageProcessing from './pages/ImageProcessing';
import History from './pages/History';
import Account from './pages/Account';
import TeamManagement from './pages/TeamManagement';
import { useUserStore } from './store/useUserStore';

const ProtectedRoute = ({ children, requireManager = false }: { children: React.ReactNode; requireManager?: boolean }) => {
  const { currentUser, init } = useUserStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireManager && currentUser.role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        
        <Route path="/product-copy" element={
          <ProtectedRoute>
            <ProductCopy />
          </ProtectedRoute>
        } />
        
        <Route path="/customer-service" element={
          <ProtectedRoute>
            <CustomerService />
          </ProtectedRoute>
        } />
        
        <Route path="/image-processing" element={
          <ProtectedRoute>
            <ImageProcessing />
          </ProtectedRoute>
        } />
        
        <Route path="/history" element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } />
        
        <Route path="/account" element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        } />
        
        <Route path="/team-management" element={
          <ProtectedRoute requireManager>
            <TeamManagement />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
