import React from 'react';
import Layout from '../components/Layout';
import { MessageSquare } from 'lucide-react';

const Messaging: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] text-gray-500">
        <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mb-6">
            <MessageSquare size={40} className="text-dark-700" />
        </div>
        <h2 className="text-2xl font-bold text-gray-300 mb-2">Messaging Center</h2>
        <p className="max-w-md text-center text-gray-600">Select a campaign or influencer to start a conversation regarding deliverables.</p>
      </div>
    </Layout>
  );
};

export default Messaging;
