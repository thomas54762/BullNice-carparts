import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

const adminTabs = [
  { path: '/admin/integrations', label: 'Pool Integrations' },
  { path: '/admin/logs', label: 'Logs' },
];

export const Admin: React.FC = () => {
  const location = useLocation();

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage integrations and view system logs"
      />

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {adminTabs.map((tab) => {
              const isActive = location.pathname === tab.path || 
                (tab.path === '/admin/integrations' && location.pathname === '/admin');
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`
                    px-6 py-3 text-sm font-medium border-b-2 transition-colors
                    ${isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};


