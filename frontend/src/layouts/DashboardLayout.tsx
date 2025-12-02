import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  {
    path: '/search',
    label: 'License Plate Search',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const userDisplayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'User';

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar items={sidebarItems} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar
            user={
              user
                ? {
                    name: userDisplayName,
                    email: user.email,
                  }
                : undefined
            }
            onLogout={logout}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};


