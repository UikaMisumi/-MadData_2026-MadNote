import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css';
import IntroOverlay from './IntroOverlay';

function Layout({ children }) {
  return (
    <div className="layout">
      <IntroOverlay />
      <Header />
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
