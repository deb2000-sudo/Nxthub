import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, MessageSquare, LogOut, Search, Shield, Menu, X, Building2, Clock } from 'lucide-react';
import { User, Role } from '../types';
import { getSession, clearSession } from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  role?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, role: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const sessionUser = getSession();
  const currentUser = sessionUser;

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  if (!currentUser) {
    return <div className="min-h-screen bg-dark-900" />;
  }
  
  // Allow prop override for role (e.g. SuperAdminPortal forcing a view)
  const currentRole = (propRole || currentUser.role) as Role;
  const currentDept = currentUser.department;

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogoClick = () => {
    if (currentRole === 'super_admin' || currentRole === 'admin') {
      navigate('/user-management');
    } else {
      navigate('/dashboard');
    }
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
          isActive 
            ? 'bg-primary-600 text-white' 
            : 'text-gray-400 hover:bg-dark-700 hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-dark-900 text-slate-200 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-4 z-50">
         <div className="flex items-center gap-2" onClick={handleLogoClick}>
            <Megaphone className="text-primary-500" size={24} />
            <h1 className="text-xl font-bold text-white tracking-tight">NxtHub</h1>
         </div>
         <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white p-2">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static top-16 md:top-0 bottom-0 left-0 z-40 w-64 bg-dark-800 border-r border-dark-700 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <div 
            className="flex items-center gap-2 mb-8 cursor-pointer group md:flex hidden" 
            onClick={handleLogoClick}
            title="Go to Dashboard"
          >
            <Megaphone className="text-primary-500 group-hover:text-primary-400 transition-colors" size={24} />
            <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-primary-100 transition-colors">NxtHub</h1>
          </div>
          
          {/* Mobile-only user info header since main header is covered/separate */}
          <div className="md:hidden mb-6">
             <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">Menu</p>
          </div>

          <div className="flex items-center gap-3 mb-8 p-3 bg-dark-700/50 rounded-xl border border-dark-700">
            {!imgError && currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-dark-700"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center border-2 border-dark-700 text-white font-bold text-sm shrink-0">
                {getInitials(currentUser.name)}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{currentUser.role} {currentUser.role === 'manager' ? `(${currentUser.department})` : ''}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {(currentRole === 'super_admin' || currentRole === 'admin') ? (
              <>
                <NavItem to="/user-management" icon={Shield} label="User Management" />
                {(currentRole === 'super_admin' || currentRole === 'admin') && (
                  <NavItem to="/department-management" icon={Building2} label="Department Management" />
                )}
              </>
            ) : (
              <>
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/influencers" icon={Users} label="Influencers" />
                <NavItem to="/campaigns" icon={Megaphone} label="Campaigns" />
                <NavItem to="/messaging" icon={MessageSquare} label="Messaging" />
                {currentRole === 'manager' && (
                  <NavItem to="/requests" icon={Clock} label="Requests" />
                )}
              </>
            )}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 md:pt-0">
         {/* Page Content Scrollable Area */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            {children}
         </div>
      </main>
    </div>
  );
};

export default Layout;