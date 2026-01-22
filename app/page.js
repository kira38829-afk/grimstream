'use client'; // Make sure this is at the top
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import AnimeCard from '../components/AnimeCard';
import { api } from '../utils/api';

export default function Home() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching home data via proxy...');
        const data = await api.getHome();
        console.log('✅ Home data received:', data);
        
        setHomeData(data);
        
      } catch (err) {
        console.error('❌ Error fetching home data:', err);
        setError(`Failed to load anime data: ${err.message}. Please check if the proxy is working.`);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-400">Loading anime data via proxy...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-red-400 mb-2">Proxy Error</h2>
              <p className="text-gray-300 mb-4">{error}</p>
              
              <div className="text-sm text-gray-400 mb-4">
                <p>To debug:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Visit <a href="/test-proxy" className="text-blue-400 hover:underline">/test-proxy</a> to check if proxy works</li>
                  <li>Check browser console for detailed errors</li>
                  <li>Make sure the API route file exists at: app/api/anime/[...path]/route.js</li>
                </ol>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="bg-accent hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* API Status */}
      

        {/* Render anime sections */}
        {homeData?.spotlightAnimes && homeData.spotlightAnimes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Spotlight Anime</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {homeData.spotlightAnimes.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
        )}

        {/* Add more sections as needed */}
      </main>
    </div>
  );
}