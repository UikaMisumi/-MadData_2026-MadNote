// src/components/Header.jsx
import React from 'react';
// Import your existing AuthContext (Adjust the path if necessary)
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  // Helper function to get user initials for the avatar placeholder
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
      
      {/* Logo Section */}
      <div className="flex items-center gap-2 cursor-pointer">
        <span className="text-2xl">🧠</span>
        <h1 className="font-bold text-2xl tracking-tight text-gray-900">MadNote.</h1>
      </div>

      <div className="flex items-center gap-6">
        
        {/* Category Navigation (Hidden on mobile devices) */}
        <div className="hidden md:flex gap-3">
          <span className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full cursor-pointer shadow-md">
            All Feed
          </span>
          <span className="px-5 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-full cursor-pointer transition">
            🤖 Robotics
          </span>
          <span className="px-5 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-full cursor-pointer transition">
            💡 Foundation Models
          </span>
        </div>

        {/* User Account / Auth Section */}
        {user ? (
          // Authenticated State: Show User Profile & Dropdown
          <div className="relative group z-50">
            {/* Clickable Profile Badge */}
            <div className="flex items-center gap-3 cursor-pointer p-1 pr-3 rounded-full hover:bg-gray-100 transition border border-transparent hover:border-gray-200">
              
              {/* Gradient Avatar */}
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                {getInitials(user.name)}
              </div>
              
              {/* User Info (Hidden on mobile) */}
              <div className="hidden md:block text-sm">
                <p className="font-bold text-gray-900 leading-none">{user.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user.bio || 'Researcher'}</p>
              </div>
              
              {/* Dropdown Chevron Icon */}
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            
            {/* Dropdown Menu (Revealed on hover via Tailwind 'group-hover') */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform origin-top-right scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Account</p>
                <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
              </div>
              
              {/* Navigation Links inside Dropdown */}
              <div className="p-2">
                <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition">
                  <span>👤</span> My Profile
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition">
                  <span>📚</span> My Library
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition">
                  <span>⚙️</span> Settings
                </a>
              </div>
              
              {/* Sign Out Action */}
              <div className="p-2 border-t border-gray-100">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <span>🚪</span> Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Unauthenticated State: Show Login/Signup Buttons
          <div className="flex gap-3">
             <button className="text-sm font-bold text-gray-600 hover:text-gray-900 px-2">
               Log In
             </button>
             <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-full hover:bg-indigo-700 transition shadow-md">
               Sign Up
             </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Header;