import React, { useState } from 'react';
import { Table } from '../../components/Table';
import { Badge } from '../../components/Badge';
import { InputField } from '../../components/InputField';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-11-27T08:30:00Z',
    level: 'info',
    source: 'AutoParts Direct',
    message: 'Successfully synced 150 parts',
  },
  {
    id: '2',
    timestamp: '2024-11-27T08:25:00Z',
    level: 'info',
    source: 'QuickParts',
    message: 'API call completed successfully',
  },
  {
    id: '3',
    timestamp: '2024-11-27T08:20:00Z',
    level: 'warning',
    source: 'PartsWorld',
    message: 'Rate limit approaching threshold',
  },
  {
    id: '4',
    timestamp: '2024-11-27T08:15:00Z',
    level: 'error',
    source: 'PartsWorld',
    message: 'Failed to connect to API endpoint',
  },
  {
    id: '5',
    timestamp: '2024-11-27T08:10:00Z',
    level: 'info',
    source: 'System',
    message: 'Daily sync job started',
  },
];

export const Logs: React.FC = () => {
  const [logs] = useState<LogEntry[]>(mockLogs);
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(filter.toLowerCase()) ||
    log.source.toLowerCase().includes(filter.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (item: LogEntry) => formatDate(item.timestamp),
    },
    {
      key: 'level',
      header: 'Level',
      render: (item: LogEntry) => {
        const variants = {
          info: 'info' as const,
          warning: 'warning' as const,
          error: 'error' as const,
        };
        return <Badge variant={variants[item.level]}>{item.level}</Badge>;
      },
    },
    {
      key: 'source',
      header: 'Source',
      render: (item: LogEntry) => <span className="font-medium">{item.source}</span>,
    },
    {
      key: 'message',
      header: 'Message',
      render: (item: LogEntry) => item.message,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Logs</h2>
        <InputField
          label="Filter Logs"
          placeholder="Search by message or source..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Table
        data={filteredLogs}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="No logs found"
      />
    </div>
  );
};


