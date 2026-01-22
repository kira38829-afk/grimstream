// app/search/page.js
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import AnimeCard from '../../components/AnimeCard';
import { api } from '../../utils/api';

export default function Search() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const searchAnime = async () => {
      if (!query) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      setSearchError(null);
      try {
        console.log(`🔍 Searching for: "${query}"`);
        const data = await api.search(query);
        console.log('📊 Search results data:', data);
        
        // Handle different response structures
        const searchResults = data.animes || data.results || data || [];
        setResults(searchResults);
        
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Search failed. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to avoid too many requests
    const timeoutId = setTimeout(searchAnime, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          {query ? `Search Results for "${query}"` : 'Search Anime'}
        </h1>

        {searchError && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">{searchError}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            <p className="text-gray-400 mt-2">Searching for "{query}"...</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((anime, index) => (
              <AnimeCard key={anime.id || `search-${index}`} anime={anime} />
            ))}
          </div>
        )}

        {!loading && results.length === 0 && query && !searchError && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No results found for "{query}"</p>
            <p className="text-sm mt-2">Try different keywords or check spelling</p>
          </div>
        )}

        {!loading && !query && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">Enter a search term to find anime</p>
          </div>
        )}
      </main>
    </div>
  );
}