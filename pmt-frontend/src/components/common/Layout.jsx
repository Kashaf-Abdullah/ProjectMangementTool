import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import '../../styles/components/layout.css';

const Layout = () => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-main">
        <Sidebar />
        <main className="app-content">
          <div className="main-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;