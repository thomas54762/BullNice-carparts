import React from 'react';
import { Badge } from './Badge';
import { Button } from './Button';

export interface SearchResultItem {
  id: string;
  title: string;
  partNumber: string;
  description: string;
  image: string;
  price: number;
  deliveryTime: string;
  deliverySpeed: number;
  matchScore: number;
  sourceUrl: string;
  supplier: string;
}

interface SearchCardProps {
  item: SearchResultItem;
  onViewSource?: (url: string) => void;
}

export const SearchCard: React.FC<SearchCardProps> = ({
  item,
  onViewSource,
}) => {
  const handleViewSource = () => {
    if (onViewSource) {
      onViewSource(item.sourceUrl);
    } else {
      window.open(item.sourceUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-48 flex-shrink-0">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-48 md:h-full object-cover"
          />
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <div className="flex gap-2 ml-4">
              <Badge variant="info">{item.matchScore}% Match</Badge>
              <Badge variant="success">{item.deliverySpeed}/10 Speed</Badge>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Part #:</span> {item.partNumber}
          </p>
          
          <p className="text-gray-700 mb-4 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-2xl font-bold text-primary-600">
                  ${item.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  <span className="font-medium">Delivery:</span> {item.deliveryTime}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Supplier: {item.supplier}
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleViewSource}
              className="ml-4"
            >
              View Source
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


