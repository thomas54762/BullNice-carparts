import axios from 'axios';
import { api } from '../utils/api';

export interface VehicleInfo {
  plate: string;
  brand: string;
  model: string;
  buildYear: number;
  color: string;
  fuelType: string;
}

export interface PartInfo {
  message: string;
  categories?: string[];
  data?: Record<string, string[]>;
  flag: string;
  sessionId?: string;
}

export interface CategoryData {
  message: string;
  category: string;
  links: string[];
}
export const vehicleService = {
  async getVehicleInfo(plate: string): Promise<VehicleInfo | null> {
    try {
      const response = await axios.get(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${plate}`);
      const data = response.data[0];
      return {
        plate: data.kenteken,
        brand: data.merk,
        model: data.handelsbenaming,
        buildYear: new Date(data.datum_eerste_toelating_dt).getFullYear(),
        color: data.eerste_kleur,
        fuelType: data.brandstof,
      };
    } catch (error) {
      return null;
    }
  },
  async getPartInfo(licensePlate: string, partName: string): Promise<PartInfo | null> {
    try {
      const response = await api.post("/search/parts-search/", {
        license_plate: licensePlate,
        part_name: partName,
      });

      if (response.data) {
        return response.data as PartInfo;
      }

      return null;
    } catch (error: any) {
      // Handle rate limit errors (429)
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment before searching again.');
      }
      throw error;
    }
  },
  async getCategoryData(sessionId: string, category: string): Promise<CategoryData | null> {
    try {
      const response = await api.post("/search/category-data/", {
        session_id: sessionId,
        category: category,
      });

      if (response.data) {
        return response.data as CategoryData;
      }

      return null;
    } catch (error) {
      console.error('Error fetching category data:', error);
      return null;
    }
  },
};
