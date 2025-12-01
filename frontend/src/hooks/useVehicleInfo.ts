import { useEffect, useState } from 'react';
import type { VehicleInfo } from '../services/vehicleService';
import { vehicleService } from '../services/vehicleService';

export const useVehicleInfo = (plate: string | null) => {
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plate || plate.trim().length === 0) {
      setVehicleInfo(null);
      setError(null);
      return;
    }

    const fetchVehicleInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const info = await vehicleService.getVehicleInfo(plate);
        if (info) {
          setVehicleInfo(info);
        } else {
          setError('Vehicle not found for this license plate');
          setVehicleInfo(null);
        }
      } catch (err) {
        setError('Failed to fetch vehicle information');
        setVehicleInfo(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchVehicleInfo();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [plate]);

  return { vehicleInfo, loading, error };
};

