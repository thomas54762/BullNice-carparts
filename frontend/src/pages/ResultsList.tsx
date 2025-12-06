import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PageHeader } from '../components/PageHeader';
import type { SearchResultGroup } from '../services/resultsService';
import { resultsService } from '../services/resultsService';

export const ResultsList: React.FC = () => {
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resultsService.getSearchResultGroups();
      setGroups(data);
    } catch (err) {
      setError('Failed to load results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div>
      <PageHeader
        title="Results"
        subtitle="Browse your past search results by search keyword"
      />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={fetchGroups}
            className="px-3 py-1 text-sm font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50"
          >
            Refresh
          </button>
        </div>
        {loading && (
          <div className="space-y-2">
            <LoadingSkeleton lines={3} />
          </div>
        )}

        {!loading && error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="text-sm text-gray-600">
            No results found yet. Perform a search and select a category to generate results.
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Search Keyword</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Items</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Latest</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((group) => (
                  <tr key={group.search_result_id}>
                    <td className="px-4 py-2 text-gray-900">
                      <Link
                        to={`/results/${group.search_result_id}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {group.search_keyword}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{group.count}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {new Date(group.latest_created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/results/${group.search_result_id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


