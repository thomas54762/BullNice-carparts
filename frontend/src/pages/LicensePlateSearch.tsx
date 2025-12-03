import React, { useState } from 'react';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PageHeader } from '../components/PageHeader';
import { useVehicleInfo } from '../hooks/useVehicleInfo';
import { vehicleService } from '../services/vehicleService';

export const LicensePlateSearch: React.FC = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [partName, setPartName] = useState('');
  const [errors, setErrors] = useState<{ plate?: string; part?: string }>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<string>('');
  const [partInfoLoading, setPartInfoLoading] = useState(false);
  const [partInfoError, setPartInfoError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [categoryLinks, setCategoryLinks] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(false);
  const [categoryDataLoading, setCategoryDataLoading] = useState(false);

  const { vehicleInfo, loading: vehicleLoading, error: vehicleError } = useVehicleInfo(
    licensePlate.length >= 3 ? licensePlate : null
  );

  const handleSearch = async () => {
    const newErrors: { plate?: string; part?: string } = {};

    if (!licensePlate.trim()) {
      newErrors.plate = 'License plate is required';
    }

    if (!partName.trim()) {
      newErrors.part = 'Part name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear all old data when starting a new search
    setErrors({});
    setSelectedCategory(null);
    setShowCategorySelection(false);
    setPartInfoError(null);
    setCategories([]);
    setCategoryMessage('');
    setSessionId(null);
    setCategoryLinks([]);
    setShowLinks(false);
    setCategoryDataLoading(false);
    setPartInfoLoading(true);

    if (
      !vehicleInfo ||
      !vehicleInfo.brand ||
      !vehicleInfo.model ||
      !vehicleInfo.car_type
    ) {
      setPartInfoLoading(false);
      setPartInfoError('Vehicle details are still loading. Please wait and try again.');
      return;
    }

    try {
      const partInfo = await vehicleService.getPartInfo(
        licensePlate,
        partName,
        vehicleInfo.brand,
        vehicleInfo.model,
        vehicleInfo.car_type,
      );
      setPartInfoLoading(false);

      if (partInfo) {
        if (partInfo.flag === 'select_category') {
          setCategories(partInfo.categories || []);
          setCategoryMessage(partInfo.message || 'Please select a category');
          setSessionId(partInfo.sessionId || null);
          setShowCategorySelection(true);
          return;
        } else {
          // If flag is 'success' or other, display the data directly
          // Data will be displayed in the component based on partInfo.data
          if (partInfo.data) {
            // Handle single category result - extract links if available
            const dataKeys = Object.keys(partInfo.data);
            if (dataKeys.length > 0) {
              const firstCategory = dataKeys[0];
              const links = partInfo.data[firstCategory];
              if (Array.isArray(links)) {
                setCategoryLinks(links);
                setSelectedCategory(firstCategory);
                setShowLinks(true);
              }
            }
          }
        }
      } else {
        setPartInfoError('No part information found. Please try again.');
      }
    } catch (error: any) {
      setPartInfoLoading(false);
      // Use specific error message if available, otherwise show generic message
      const errorMessage = error?.message || 'Failed to fetch part information. Please try again.';
      setPartInfoError(errorMessage);
      console.error('Error fetching part info:', error);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setCategoryDataLoading(true);
    setPartInfoError(null);

    if (!sessionId) {
      setPartInfoError('Session expired. Please search again.');
      setCategoryDataLoading(false);
      return;
    }

    try {
      const categoryData = await vehicleService.getCategoryData(sessionId, category);
      setCategoryDataLoading(false);

      if (categoryData && categoryData.links) {
        setCategoryLinks(categoryData.links);
        setShowLinks(true);
        setShowCategorySelection(false);
      } else {
        setPartInfoError('Failed to retrieve links for the selected category. Please try again.');
      }
    } catch (error) {
      setCategoryDataLoading(false);
      setPartInfoError('Failed to fetch category data. Please try again.');
      console.error('Error fetching category data:', error);
    }
  };

  return (
    <div>
      <PageHeader
        title="License Plate Search"
        subtitle="Enter license plate and part name to find matching car parts"
      />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <InputField
              label="License Plate"
              placeholder="e.g., HR312G"
              value={licensePlate}
              onChange={(e) => {
                const rawValue = e.target.value;
                const sanitizedValue = rawValue.replace(/[^A-Za-z0-9]/g, '');

                // If user tried to enter "-" or any special character, show a tooltip-style error
                if (rawValue !== sanitizedValue) {
                  setErrors({
                    ...errors,
                    plate: 'Only letters and numbers are allowed (no "-" or special characters).',
                  });
                } else {
                  setErrors({ ...errors, plate: undefined });
                }

                setLicensePlate(sanitizedValue);
              }}
              error={errors.plate}
              helperText="Enter the vehicle's license plate number (letters and numbers only)"
            />

            {vehicleLoading && (
              <div className="mt-2">
                <LoadingSkeleton lines={2} />
              </div>
            )}

            {vehicleError && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{vehicleError}</p>
              </div>
            )}

            {vehicleInfo && !vehicleLoading && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">Vehicle Found:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Brand:</span>
                    <span className="ml-2 font-medium text-gray-900">{vehicleInfo.brand}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Model:</span>
                    <span className="ml-2 font-medium text-gray-900">{vehicleInfo.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Year:</span>
                    <span className="ml-2 font-medium text-gray-900">{vehicleInfo.buildYear}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fuel Type:</span>
                    <span className="ml-2 font-medium text-gray-900">{vehicleInfo.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Car Type:</span>
                    <span className="ml-2 font-medium text-gray-900">{vehicleInfo.car_type}</span>
                  </div>


                </div>
              </div>
            )}
          </div>

          <div>
            <InputField
              label="Part Name"
              placeholder="e.g., Brake Pads, Air Filter, Oil Filter"
              value={partName}
              onChange={(e) => {
                setPartName(e.target.value);
                setErrors({ ...errors, part: undefined });
                // Reset category selection when part name changes
                setShowCategorySelection(false);
                setSelectedCategory(null);
                setCategories([]);
                setSessionId(null);
                setCategoryLinks([]);
                setShowLinks(false);
              }}
              error={errors.part}
              helperText="Enter the name of the part you're looking for"
            />
          </div>

          {partInfoLoading && (
            <div className="mt-2">
              <LoadingSkeleton lines={2} />
            </div>
          )}

          {partInfoError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{partInfoError}</p>
            </div>
          )}

          {categoryDataLoading && (
            <div className="mt-2">
              <LoadingSkeleton lines={2} />
            </div>
          )}

          {showCategorySelection && categories.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-3">
                {categoryMessage}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    variant={selectedCategory === category ? 'primary' : 'outline'}
                    className="text-sm"
                    disabled={categoryDataLoading}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showLinks && categoryLinks.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-3">
                Found {categoryLinks.length} link{categoryLinks.length !== 1 ? 's' : ''} for {selectedCategory}:
              </p>
              <div className="space-y-2">
                {categoryLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 break-all">{link}</span>
                      <svg
                        className="w-5 h-5 text-green-600 ml-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleSearch}
              disabled={vehicleLoading || partInfoLoading}
              isLoading={partInfoLoading}
              className="flex-1"
            >
              Search Parts
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLicensePlate('');
                setPartName('');
                setErrors({});
                setCategories([]);
                setSelectedCategory(null);
                setShowCategorySelection(false);
                setPartInfoError(null);
                setPartInfoLoading(false);
                setSessionId(null);
                setCategoryLinks([]);
                setShowLinks(false);
                setCategoryDataLoading(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


