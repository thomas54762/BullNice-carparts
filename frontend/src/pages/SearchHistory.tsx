import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { searchService } from '../services/searchService';

interface HistoryItem {
  id: string;
  date: string;
  licensePlate: string;
  partName: string;
  resultsCount: number;
}

export const SearchHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await searchService.getSearchHistory();
        setHistory(data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRerunSearch = (plate: string, part: string) => {
    navigate(`/results?plate=${encodeURIComponent(plate)}&part=${encodeURIComponent(part)}`);
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (item: HistoryItem) => formatDate(item.date),
    },
    {
      key: 'licensePlate',
      header: 'License Plate',
      render: (item: HistoryItem) => (
        <span className="font-medium">{item.licensePlate}</span>
      ),
    },
    {
      key: 'partName',
      header: 'Part Name',
      render: (item: HistoryItem) => item.partName,
    },
    {
      key: 'resultsCount',
      header: 'Results',
      render: (item: HistoryItem) => (
        <span className="text-gray-600">{item.resultsCount} parts found</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item: HistoryItem) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRerunSearch(item.licensePlate, item.partName)}
        >
          Re-run Search
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Search History" />
        <div className="bg-white rounded-lg shadow p-6">
          <LoadingSkeleton lines={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Search History"
        subtitle="View and re-run your previous searches"
      />

      <div className="bg-white rounded-lg shadow">
        <Table
          data={history}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyMessage="No search history available"
        />
      </div>
    </div>
  );
};

