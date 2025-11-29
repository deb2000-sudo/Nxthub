import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, MessageSquare, LogOut, Search, Shield } from 'lucide-react';
import { MOCK_USERS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  role?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, role: propRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  
  const currentRole = propRole || params.get('role');
  const currentDept = params.get('department');
  const currentEmail = params.get('email');
  
  // Find current user based on params to display in sidebar (Mocking session)
  let currentUser = MOCK_USERS.find(u => 
    (currentEmail && u.email === currentEmail) || 
    (u.role === currentRole && (u.role === 'executive' || u.department === currentDept))
  );

  // Handle Super Admin Case
  if (currentRole === 'super_admin') {
    currentUser = {
      id: 'super-admin-001',
      name: 'Super Admin',
      email: 'admin@brandnxtwave.co.in',
      role: 'super_admin',
      avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff'
    };
  }

  // Fallback
  if (!currentUser) {
    currentUser = MOCK_USERS[0];
  }

  const handleLogout = () => {
    navigate('/');
  };

  const handleLogoClick = () => {
    // Navigate to dashboard keeping the session params
    const emailParam = currentEmail ? `&email=${encodeURIComponent(currentEmail)}` : '';
    navigate(`/dashboard?role=${currentRole}&department=${currentDept}${emailParam}`);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    // preserve params
    const emailParam = currentEmail ? `&email=${encodeURIComponent(currentEmail)}` : '';
    const destination = `${to}?role=${currentRole}&department=${currentDept}${emailParam}`;
    const isActive = location.pathname === to;

    return (
      <Link
        to={destination}
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
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col flex-shrink-0 z-20">
        <div className="p-6">
          <div 
            className="flex items-center gap-2 mb-8 cursor-pointer group" 
            onClick={handleLogoClick}
            title="Go to Dashboard"
          >
            <Megaphone className="text-primary-500 group-hover:text-primary-400 transition-colors" size={24} />
            <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-primary-100 transition-colors">NxtHub</h1>
          </div>

          <div className="flex items-center gap-3 mb-8 p-3 bg-dark-700/50 rounded-xl border border-dark-700">
            <img 
              src={currentUser.avatar} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover border-2 border-dark-700"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{currentUser.role} {currentUser.role === 'manager' ? `(${currentUser.department})` : ''}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {(currentRole === 'super_admin' || currentRole === 'admin') ? (
              <NavItem to="/super-admin" icon={Shield} label="User Management" />
            ) : (
              <>
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/influencers" icon={Users} label="Influencers" />
                <NavItem to="/campaigns" icon={Megaphone} label="Campaigns" />
                <NavItem to="/messaging" icon={MessageSquare} label="Messaging" />
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
         {/* Top Bar for Mobile/Tablet or just General utility (optional based on image, but good for UX) */}
         <div className="h-16 border-b border-dark-700 bg-dark-800/50 flex items-center justify-between px-8 backdrop-blur-sm z-10">
            <h2 className="text-xl font-semibold text-white">
               {location.pathname.replace('/', '').charAt(0).toUpperCase() + location.pathname.slice(2)}
            </h2>
            <div className="flex items-center gap-4">
               {/* Placeholders for top header actions */}
               <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-dark-900 border border-dark-700 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-primary-500 w-64 text-slate-200 placeholder-gray-600"
                  />
               </div>
            </div>
         </div>

         {/* Page Content Scrollable Area */}
         <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            {children}
         </div>
      </main>
    </div>
  );
};

export default Layout;