import React, { useState } from 'react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { InputField } from '../../components/InputField';
import { Modal } from '../../components/Modal';
import { Table } from '../../components/Table';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  apiEndpoint: string;
}

const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'AutoParts Direct',
    type: 'REST API',
    status: 'active',
    lastSync: '2024-11-27T08:00:00Z',
    apiEndpoint: 'https://api.autopartsdirect.com',
  },
  {
    id: '2',
    name: 'QuickParts',
    type: 'REST API',
    status: 'active',
    lastSync: '2024-11-27T07:45:00Z',
    apiEndpoint: 'https://api.quickparts.com',
  },
  {
    id: '3',
    name: 'PartsWorld',
    type: 'GraphQL',
    status: 'error',
    lastSync: '2024-11-26T12:00:00Z',
    apiEndpoint: 'https://api.partsworld.com/graphql',
  },
];

export const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'REST API',
    apiEndpoint: '',
  });

  const handleAdd = () => {
    setEditingIntegration(null);
    setFormData({ name: '', type: 'REST API', apiEndpoint: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      name: integration.name,
      type: integration.type,
      apiEndpoint: integration.apiEndpoint,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingIntegration) {
      // Update existing
      setIntegrations(integrations.map(i =>
        i.id === editingIntegration.id
          ? { ...i, ...formData }
          : i
      ));
    } else {
      // Add new
      const newIntegration: Integration = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        status: 'inactive',
        lastSync: new Date().toISOString(),
        apiEndpoint: formData.apiEndpoint,
      };
      setIntegrations([...integrations, newIntegration]);
    }
    setIsModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: Integration) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: Integration) => item.type,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Integration) => {
        const variants = {
          active: 'success' as const,
          inactive: 'default' as const,
          error: 'error' as const,
        };
        return <Badge variant={variants[item.status]}>{item.status}</Badge>;
      },
    },
    {
      key: 'lastSync',
      header: 'Last Sync',
      render: (item: Integration) => formatDate(item.lastSync),
    },
    {
      key: 'apiEndpoint',
      header: 'API Endpoint',
      render: (item: Integration) => (
        <span className="text-sm text-gray-600 font-mono">{item.apiEndpoint}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item: Integration) => (
        <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Pool Integrations</h2>
        <Button onClick={handleAdd}>Add Integration</Button>
      </div>

      <Table
        data={integrations}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="No integrations configured"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIntegration ? 'Edit Integration' : 'Add Integration'}
        size="md"
      >
        <div className="space-y-4">
          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="REST API">REST API</option>
              <option value="GraphQL">GraphQL</option>
              <option value="SOAP">SOAP</option>
            </select>
          </div>
          <InputField
            label="API Endpoint"
            value={formData.apiEndpoint}
            onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
            placeholder="https://api.example.com"
            required
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingIntegration ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


