import resultsData from '../mock/results.json';
import type { SearchResultItem } from '../components/SearchCard';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const searchService = {
  async searchParts(_licensePlate: string, _partName: string): Promise<SearchResultItem[]> {
    // Simulate network delay
    await delay(1200);
    
    // Return top 10 results sorted by match score, delivery speed, and price
    const sortedResults = [...resultsData]
      .sort((a, b) => {
        // Primary sort: match score (descending)
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Secondary sort: delivery speed (descending)
        if (b.deliverySpeed !== a.deliverySpeed) {
          return b.deliverySpeed - a.deliverySpeed;
        }
        // Tertiary sort: price (ascending)
        return a.price - b.price;
      })
      .slice(0, 10);
    
    return sortedResults as SearchResultItem[];
  },
  
  async getSearchHistory(): Promise<any[]> {
    await delay(500);
    const historyData = await import('../mock/searchHistory.json');
    return historyData.default;
  },
};

