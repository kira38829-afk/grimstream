// utils/api.js - IMPROVED WITH RETRY LOGIC
const API_BASE = '/api/anime';

const fetchAPI = async (endpoint, retries = 3) => {
  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`🔄 Fetching via proxy: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // If it's a 5xx error, retry
      if (response.status >= 500 && response.status < 600 && retries > 0) {
        console.log(`🔄 Retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchAPI(endpoint, retries - 1);
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Proxy call successful`);
    
    if (data.success === false) {
      throw new Error(data.error || data.message || 'API returned success: false');
    }
    
    return data.data;
  } catch (error) {
    console.error(`❌ API Error:`, error);
    throw error;
  }
};

export const api = {
  getHome: async () => {
    return fetchAPI('/home');
  },

  search: async (query, page = 1) => {
    return fetchAPI(`/search?q=${encodeURIComponent(query)}&page=${page}`);
  },

  getAnimeInfo: async (animeId) => {
    return fetchAPI(`/anime/${animeId}`);
  },

  getEpisodes: async (animeId) => {
    return fetchAPI(`/anime/${animeId}/episodes`);
  },

  getEpisodeServers: async (episodeId) => {
    console.log('🎬 Getting servers for episode:', episodeId);
    
    const params = new URLSearchParams({
      animeEpisodeId: episodeId
    });
    
    return fetchAPI(`/episode/servers?${params.toString()}`);
  },
  
  getEpisodeSources: async (episodeId, server = 'vidstreaming', category = 'sub') => {
    console.log('🎬 Getting sources for episode:', episodeId);
    
    const params = new URLSearchParams({
      animeEpisodeId: episodeId,
      server: server,
      category: category
    });
    
    return fetchAPI(`/episode/sources?${params.toString()}`);
  },

  getCategory: async (category, page = 1) => {
    return fetchAPI(`/category/${category}?page=${page}`);
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch('/api/anime/home');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};