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
  const [partInfoLoading, setPartInfoLoading] = useState(false);
  const [partInfoError, setPartInfoError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string>('');

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

    // Clear old errors and set processing message
    setErrors({});
    setPartInfoError(null);
    setProcessingMessage("We're processing your request and will be ready in 2min at the results");
    setPartInfoLoading(true);

    if (
      !vehicleInfo ||
      !vehicleInfo.brand ||
      !vehicleInfo.model ||
      !vehicleInfo.car_type
    ) {
      setPartInfoLoading(false);
      setProcessingMessage('');
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

      if (!partInfo) {
        setProcessingMessage('');
        setPartInfoError('Request failed. Please try again.');
        return;
      }

      // Optionally surface backend confirmation message, but keep main processing message
      if (partInfo.message) {
        setPartInfoError(null);
      }
    } catch (error: any) {
      setPartInfoLoading(false);
      setProcessingMessage('');
      const errorMessage = error?.message || 'Failed to send search request. Please try again.';
      setPartInfoError(errorMessage);
      console.error('Error triggering search:', error);
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

          {processingMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              {processingMessage}
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
                setPartInfoError(null);
                setPartInfoLoading(false);
                setProcessingMessage('');
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


