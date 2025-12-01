import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PageHeader } from '../components/PageHeader';
import { useVehicleInfo } from '../hooks/useVehicleInfo';

export const LicensePlateSearch: React.FC = () => {
  const navigate = useNavigate();
  const [licensePlate, setLicensePlate] = useState('');
  const [partName, setPartName] = useState('');
  const [errors, setErrors] = useState<{ plate?: string; part?: string }>({});

  const { vehicleInfo, loading: vehicleLoading, error: vehicleError } = useVehicleInfo(
    licensePlate.length >= 3 ? licensePlate : null
  );

  const handleSearch = () => {
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

    setErrors({});
    navigate(`/results?plate=${encodeURIComponent(licensePlate)}&part=${encodeURIComponent(partName)}`);
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
              placeholder="e.g., HR-312-G"
              value={licensePlate}
              onChange={(e) => {
                setLicensePlate(e.target.value);
                setErrors({ ...errors, plate: undefined });
              }}
              error={errors.plate}
              helperText="Enter the vehicle's license plate number"
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
                    <span className="text-gray-600">Fuel:</span>
                    <span className="ml-2 font-medium text-gray-900">{vehicleInfo.fuelType}</span>
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

          <div className="flex gap-4">
            <Button
              onClick={handleSearch}
              disabled={vehicleLoading}
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


