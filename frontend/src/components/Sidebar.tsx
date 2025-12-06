import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="m-2">
        <Link to="/" className="flex items-center justify-center">
          <img
            src="/bullnice_logo.svg"
            alt="BullNice"
            className="h-16 mb-8 w-auto text-center"
          />
        </Link>
      </div>

      <nav className="px-4">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors
                ${isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};


