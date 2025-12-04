import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PageHeader } from '../components/PageHeader';
import type { SearchResultItem } from '../services/resultsService';
import { resultsService } from '../services/resultsService';


export const ResultDetail: React.FC = () => {
  const { searchResultId } = useParams<{ searchResultId: string }>();
  const navigate = useNavigate();

  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchResultId) {
      setError('Invalid search_result_id.');
      setLoading(false);
      return;
    }

    const idNum = Number(searchResultId);
    if (Number.isNaN(idNum)) {
      setError('Invalid search_result_id.');
      setLoading(false);
      return;
    }

    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await resultsService.getSearchResultDetail(idNum);
        setItems(data);
      } catch {
        setError('Failed to load result details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [searchResultId]);

  return (
    <div>
      <PageHeader
        title={`Result: ${searchResultId ?? ''}`}
        subtitle="Detailed website results for the selected search_result_id"
      />

      <div className="bg-white rounded-lg shadow p-6">
        <button
          type="button"
          onClick={() => navigate('/results')}
          className="mb-4 text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back to Results
        </button>

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

        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-gray-600">
            No website results found for this search_result_id.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">website_search_id</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Title</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Price</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">URL</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.website_search_id}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {item.website_search_id}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {item.title || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {item.price}
                    </td>
                    <td className="px-4 py-2 text-gray-700 max-w-xs truncate">
                      {item.url}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Open
                      </a>
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


