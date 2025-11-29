import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowRight, BarChart3, Users, Globe } from 'lucide-react';

const GetStarted: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <Megaphone className="text-primary-500" size={28} />
          <span className="text-xl font-bold tracking-tight">NxtHub</span>
        </div>
        <button 
          onClick={handleGetStarted}
          className="px-5 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white transition-colors font-medium border border-dark-700"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px] -z-10"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          The Future of Influencer Marketing
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Manage Campaigns & Influencers in One Place
        </h1>
        
        <p className="text-xl text-gray-400 mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          Streamline your marketing workflow, track performance, and scale your brand with NxtHub's powerful management platform.
        </p>

        <button 
          onClick={handleGetStarted}
          className="group relative px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-lg font-semibold rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.6)] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 flex items-center gap-3"
        >
          Get Started Now
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl w-full px-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="bg-dark-800/50 border border-dark-700 p-8 rounded-2xl hover:border-primary-500/50 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Influencer Management</h3>
            <p className="text-gray-400">Organize and track all your influencer partnerships in a centralized database.</p>
          </div>
          <div className="bg-dark-800/50 border border-dark-700 p-8 rounded-2xl hover:border-primary-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 mb-4">
              <BarChart3 size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Campaign Tracking</h3>
            <p className="text-gray-400">Monitor campaign status, budgets, and performance metrics in real-time.</p>
          </div>
          <div className="bg-dark-800/50 border border-dark-700 p-8 rounded-2xl hover:border-primary-500/50 transition-colors">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-4">
              <Globe size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Global Reach</h3>
            <p className="text-gray-400">Scale your marketing efforts across different regions and languages effortlessly.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 text-sm border-t border-dark-800">
        © 2025 NxtHub. All rights reserved.
      </footer>
    </div>
  );
};

export default GetStarted;
