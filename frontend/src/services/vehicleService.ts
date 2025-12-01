import vehicleData from '../mock/vehicle.json';

export interface VehicleInfo {
  plate: string;
  brand: string;
  model: string;
  buildYear: number;
  color: string;
  fuelType: string;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const vehicleService = {
  async getVehicleInfo(plate: string): Promise<VehicleInfo | null> {
    // Simulate network delay
    await delay(800);

    const normalizedPlate = plate.toUpperCase().replace(/\s+/g, '');
    const vehicle = (vehicleData as Record<string, VehicleInfo>)[normalizedPlate];

    if (!vehicle) {
      return null;
    }

    return vehicle;
  },
};


