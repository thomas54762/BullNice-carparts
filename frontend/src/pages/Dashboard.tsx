import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { PageHeader } from '../components/PageHeader';
import { searchService } from '../services/searchService';

interface RecentSearch {
  plate: string;
  part: string;
  date: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [licensePlate, setLicensePlate] = useState('');
  const [partName, setPartName] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSearches: 0,
    partsFound: 0,
    avgMatchScore: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const history = await searchService.getSearchHistory();
        // Transform history data to recent searches format
        const recent = history.slice(0, 3).map((item: any) => ({
          plate: item.licensePlate || '',
          part: item.partName || '',
          date: item.date || '',
        }));
        setRecentSearches(recent);

        // Calculate stats from history
        const totalSearches = history.length;
        const partsFound = history.reduce((sum: number, item: any) => sum + (item.resultsCount || 0), 0);
        const avgMatchScore = totalSearches > 0 ? Math.round(partsFound / totalSearches) : 0;

        setStats({
          totalSearches,
          partsFound,
          avgMatchScore,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleQuickSearch = () => {
    if (licensePlate && partName) {
      navigate(`/results?plate=${encodeURIComponent(licensePlate)}&part=${encodeURIComponent(partName)}`);
    }
  };

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
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : recentSearches.length > 0 ? (
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
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats.totalSearches}</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Parts Found</h3>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats.partsFound}</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg. Results per Search</h3>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{stats.avgMatchScore}</p>
          )}
        </div>
      </div>
    </div>
  );
};

