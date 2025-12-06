import { api } from '../utils/api';

export interface SearchResultGroup {
  search_result_id: number;
  search_keyword: string;
  count: number;
  latest_created_at: string;
}

export interface SearchResultItem {
  website_search_id: number;
  title: string;
  price: string;
  url: string;
}

export interface SearchResultDetail {
  search_keyword: string;
  items: SearchResultItem[];
}

export const resultsService = {
  async getSearchResultGroups(): Promise<SearchResultGroup[]> {
    const response = await api.get('/search/search-results/');
    return response.data as SearchResultGroup[];
  },

  async getSearchResultDetail(searchResultId: number): Promise<SearchResultDetail> {
    const response = await api.get(`/search/search-results/${searchResultId}/`);
    return response.data as SearchResultDetail;
  },
};



