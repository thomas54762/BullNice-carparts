import { api } from '../utils/api';

export interface SearchResultGroup {
  search_result_id: number;
  count: number;
  latest_created_at: string;
}

export interface SearchResultItem {
  website_search_id: number;
  title: string;
  price: string;
  url: string;
}

export const resultsService = {
  async getSearchResultGroups(): Promise<SearchResultGroup[]> {
    const response = await api.get('/search/search-results/');
    return response.data as SearchResultGroup[];
  },

  async getSearchResultDetail(searchResultId: number): Promise<SearchResultItem[]> {
    const response = await api.get(`/search/search-results/${searchResultId}/`);
    return response.data as SearchResultItem[];
  },
};



