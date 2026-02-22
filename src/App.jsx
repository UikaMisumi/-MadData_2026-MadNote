import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import './styles/tokens.css';

import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import AboutUs from './components/AboutUs';
import OtherInfo from './components/OtherInfo';
import NotificationsPage from './components/NotificationsPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProfilePage from './components/ProfilePage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PostsProvider>
          <HashRouter>
            <Routes>
              {/* Full-screen auth pages */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Main application layout */}
              <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/about-us" element={<AboutUs />} />
                      <Route path="/other-info" element={<OtherInfo />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/help" element={<div>Help & Support</div>} />
                      <Route path="/privacy" element={<SettingsPage />} />
                      <Route path="/terms" element={<div>Terms of Service</div>} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </HashRouter>
        </PostsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
