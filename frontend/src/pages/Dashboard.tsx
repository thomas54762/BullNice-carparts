import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [licensePlate, setLicensePlate] = useState('');
  const [partName, setPartName] = useState('');

  const handleQuickSearch = () => {
    if (licensePlate && partName) {
      navigate(`/results?plate=${encodeURIComponent(licensePlate)}&part=${encodeURIComponent(partName)}`);
    }
  };

  const recentSearches = [
    { plate: 'HR-312-G', part: 'Brake Pads', date: '2 hours ago' },
    { plate: 'DL-1234-A', part: 'Air Filter', date: '1 day ago' },
    { plate: 'HR-312-G', part: 'Oil Filter', date: '2 days ago' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Quick access to search and recent activity"
      />

      {/* Quick Search Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <InputField
            label="License Plate"
            placeholder="e.g., HR-312-G"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
          />
          <InputField
            label="Part Name"
            placeholder="e.g., Brake Pads"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
          />
        </div>
        <Button
          onClick={handleQuickSearch}
          disabled={!licensePlate || !partName}
          className="w-full md:w-auto"
        >
          Search Parts
        </Button>
      </div>

      {/* Recent Searches */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Searches</h2>
        {recentSearches.length > 0 ? (
          <div className="space-y-3">
            {recentSearches.map((search, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/results?plate=${encodeURIComponent(search.plate)}&part=${encodeURIComponent(search.part)}`)}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {search.part} - {search.plate}
                  </p>
                  <p className="text-sm text-gray-500">{search.date}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent searches</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Searches</h3>
          <p className="text-3xl font-bold text-gray-900">24</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Parts Found</h3>
          <p className="text-3xl font-bold text-gray-900">156</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg. Match Score</h3>
          <p className="text-3xl font-bold text-gray-900">87%</p>
        </div>
      </div>
    </div>
  );
};

