import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import IosInstallHint from './components/IosInstallHint';
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';
import ScanPage from './pages/ScanPage';
import DeliveryPage from './pages/DeliveryPage';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import BarcodesPage from './pages/BarcodesPage';
import TeamPage from './pages/TeamPage';
import AlertsPage from './pages/AlertsPage';
import LocationsPage from './pages/LocationsPage';
import SuppliersPage from './pages/SuppliersPage';

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
        <Route path="/delivery" element={<ProtectedRoute><DeliveryPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute managerOnly><ProductsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute managerOnly><ReportsPage /></ProtectedRoute>} />
        <Route path="/barcodes" element={<ProtectedRoute managerOnly><BarcodesPage /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute managerOnly><TeamPage /></ProtectedRoute>} />
        <Route path="/locations" element={<ProtectedRoute managerOnly><LocationsPage /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute managerOnly><SuppliersPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <IosInstallHint />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
