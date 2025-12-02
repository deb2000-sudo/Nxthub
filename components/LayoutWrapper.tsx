import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './Layout';

const LayoutWrapper: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default LayoutWrapper;
