import { useCallback, useState } from 'react';
import type { SearchResultItem } from '../components/SearchCard';
import { searchService } from '../services/searchService';

export const useSearchParts = () => {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (licensePlate: string, partName: string) => {
    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchService.searchParts(licensePlate, partName);
      setResults(searchResults);
    } catch (err) {
      setError('Failed to search for parts');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, reset };
};

