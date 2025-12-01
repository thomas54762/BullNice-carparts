import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SearchCard } from '../components/SearchCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { useSearchParts } from '../hooks/useSearchParts';

export const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const licensePlate = searchParams.get('plate') || '';
  const partName = searchParams.get('part') || '';

  const { results, loading, error, search } = useSearchParts();

  useEffect(() => {
    if (licensePlate && partName) {
      search(licensePlate, partName);
    }
  }, [licensePlate, partName, search]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Search Results"
          subtitle={`Searching for "${partName}" for ${licensePlate}...`}
        />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Search Results"
          subtitle={`Error searching for "${partName}"`}
        />
        <EmptyState
          title="Search Error"
          description={error}
          action={
            <Button onClick={() => navigate('/search')}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div>
        <PageHeader
          title="Search Results"
          subtitle={`No results found for "${partName}"`}
        />
        <EmptyState
          title="No Parts Found"
          description="We couldn't find any matching parts for your search. Try adjusting your search terms."
          action={
            <Button onClick={() => navigate('/search')}>
              New Search
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Search Results"
        subtitle={`Found ${results.length} parts for "${partName}" - ${licensePlate}`}
        action={
          <Button variant="outline" onClick={() => navigate('/search')}>
            New Search
          </Button>
        }
      />

      <div className="space-y-6">
        {results.map((item) => (
          <SearchCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

