// app/anime/[id]/page.js - FIXED
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import EpisodeList from '../../../components/EpisodeList';
import { api } from '../../../utils/api';
import { Play, Calendar, Clock, Star } from 'lucide-react';

export default function AnimeDetail() {
  const params = useParams();
  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get proper episode ID - UPDATED
  const getEpisodeId = (episode) => {
    console.log('🎬 Getting episode ID for:', episode);
    
    // Priority 1: Use the episodeId from API if it exists and is valid
    if (episode.episodeId && typeof episode.episodeId === 'string') {
      console.log('✅ Using API episodeId:', episode.episodeId);
      return episode.episodeId;
    }
    
    // Priority 2: If episode has its own ID field with proper format
    if (episode.id && typeof episode.id === 'string' && episode.id.includes('?ep=')) {
      console.log('✅ Using episode.id:', episode.id);
      return episode.id;
    }
    
    // Priority 3: Get episode number from various possible fields
    const episodeNumber = episode.number || episode.episodeNum || episode.episode || 1;
    console.log('🔢 Episode number found:', episodeNumber);
    
    // Create the CORRECT format: anime-id?ep=number
    // Remove any numbers at the end of anime ID for cleaner format
    const cleanAnimeId = params.id.replace(/-\d+$/, '');
    const episodeId = `${cleanAnimeId}?ep=${episodeNumber}`;
    
    console.log('🔧 Generated episode ID:', episodeId);
    return episodeId;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📖 Fetching anime info for:', params.id);
        const [info, eps] = await Promise.all([
          api.getAnimeInfo(params.id),
          api.getEpisodes(params.id)
        ]);
        
        console.log('🎌 Full anime info response:', info);
        console.log('📺 Full episodes response:', eps);
        
        // Log the actual episode data structure
        if (eps && eps.episodes) {
          console.log('🔍 EPISODE DATA STRUCTURE ANALYSIS:');
          eps.episodes.forEach((episode, index) => {
            console.log(`Episode ${index + 1}:`, JSON.stringify(episode, null, 2));
            
            // Test what episode ID would be generated
            const testEpisodeId = getEpisodeId(episode);
            console.log(`   Generated ID: ${testEpisodeId}`);
          });
        }
        
        setAnimeInfo(info.anime?.info || info);
        setEpisodes(eps.episodes || []);
        
      } catch (err) {
        console.error('Error fetching anime data:', err);
        setError('Failed to load anime information');
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-secondary rounded w-1/4 mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !animeInfo) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-gray-300">{error || 'Anime not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the first episode and its ID
  const firstEpisode = episodes?.[0];
  const firstEpisodeId = firstEpisode ? getEpisodeId(firstEpisode) : null;

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <img
            src={animeInfo.poster}
            alt={animeInfo.name}
            className="w-full md:w-80 rounded-lg shadow-2xl"
          />
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-4">{animeInfo.name}</h1>
            <p className="text-gray-300 mb-6 leading-relaxed">{animeInfo.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center text-gray-300">
                <Star className="h-5 w-5 text-yellow-400 mr-2" />
                <span>{animeInfo.stats?.rating || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span>EP {animeInfo.stats?.episodes?.sub || animeInfo.stats?.episodes?.dub || episodes.length}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span>{animeInfo.stats?.duration || 'N/A'}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <span className="bg-accent px-2 py-1 rounded text-sm">
                  {animeInfo.stats?.type || 'TV'}
                </span>
              </div>
            </div>

            {firstEpisodeId && (
              <a
                href={`/watch/${encodeURIComponent(firstEpisodeId)}`}
                className="inline-flex items-center bg-accent hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Play className="h-5 w-5 mr-2" />
                Watch Now
              </a>
            )}

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && firstEpisodeId && (
              <div className="mt-4 p-3 bg-blue-900/20 rounded text-sm">
                <p className="text-blue-300">First Episode ID: {firstEpisodeId}</p>
                <p className="text-blue-400 text-xs">Check console for detailed episode analysis</p>
              </div>
            )}
          </div>
        </div>

        {/* Episodes */}
        {episodes && episodes.length > 0 && (
          <EpisodeList episodes={episodes} animeId={params.id} />
        )}

        {/* Test different episode formats */}
        {process.env.NODE_ENV === 'development' && episodes.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mt-8">
            <h3 className="text-yellow-400 font-bold mb-2">Episode ID Test</h3>
            <div className="space-y-2 text-sm">
              <p className="text-yellow-300">Testing different episode formats:</p>
              {episodes.slice(0, 3).map((episode, index) => {
                const episodeNumber = episode.number || episode.episodeNum || episode.episode || (index + 1);
                
                // Test different formats
                const formats = [
                  `${params.id.replace(/-\d+$/, '')}?ep=${episodeNumber}`, // Clean format
                  `${params.id}?ep=${episodeNumber}`, // With numbers
                  `${params.id.replace(/-\d+$/, '')}-${episodeNumber}`, // No query param
                ];
                
                return (
                  <div key={index} className="p-2 bg-black/20 rounded">
                    <span className="text-gray-300">Episode {episodeNumber}:</span>
                    <div className="mt-1 space-y-1">
                      {formats.map((format, formatIndex) => (
                        <div key={formatIndex} className="flex items-center justify-between">
                          <code className="text-yellow-200 text-xs">{format}</code>
                          <button
                            onClick={async () => {
                              console.log(`Testing: ${format}`);
                              try {
                                const response = await fetch(`/api/anime/episode/servers?animeEpisodeId=${format}`);
                                const data = await response.json();
                                if (data.data && data.data.sub && data.data.sub.length > 0) {
                                  alert(`✅ ${format} - SERVERS FOUND!`);
                                } else {
                                  alert(`❌ ${format} - No servers`);
                                }
                              } catch (error) {
                                alert(`❌ ${format} - Error: ${error.message}`);
                              }
                            }}
                            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                          >
                            Test
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}