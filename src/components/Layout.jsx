import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout({ children, onSearch }) {
  return (
    <div className="layout">
      <Header onSearch={onSearch} />
      <div className="layout-body">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
