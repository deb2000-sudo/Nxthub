import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import GetStarted from './pages/GetStarted';
import Campaigns from './pages/Campaigns';
import Dashboard from './pages/Dashboard';
import Influencers from './pages/Influencers';
import Messaging from './pages/Messaging';
import RoleAssignment from './pages/RoleAssignment';
import SuperAdminPortal from './pages/SuperAdminPortal';
import DepartmentManagement from './pages/DepartmentManagement';
import Requests from './pages/Requests';
import { initializeDatabase } from './services/seedService';
import ErrorBoundary from './components/ErrorBoundary';
import LayoutWrapper from './components/LayoutWrapper';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize database on app start
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<GetStarted />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes with Persistent Layout */}
          <Route element={<LayoutWrapper />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/influencers" element={<Influencers />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/role-assignment" element={<RoleAssignment />} />
            <Route path="/user-management" element={<SuperAdminPortal />} />
            <Route path="/department-management" element={<DepartmentManagement />} />
            <Route path="/requests" element={<Requests />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};



export default App;
