// components/EpisodeList.js - COMPLETE FIXED VERSION
import Link from 'next/link';

export default function EpisodeList({ episodes, animeId }) {
  console.log('📺 Episodes in EpisodeList:', episodes);
  console.log('🎯 Anime ID from props:', animeId);
  
  // Define getEpisodeNumber function
  const getEpisodeNumber = (episode, index) => {
    return episode.number || episode.episodeNum || episode.episode || (index + 1);
  };

  // Define getEpisodeTitle function
  const getEpisodeTitle = (episode, episodeNumber) => {
    if (episode.title && episode.title.trim()) {
      return episode.title;
    }
    return `Episode ${episodeNumber}`;
  };
  
  const getEpisodeId = (episode, index) => {
    console.log('🎬 Raw episode data:', episode);
    
    // Priority 1: Use the exact episodeId from API if available
    if (episode.episodeId && typeof episode.episodeId === 'string') {
      console.log('✅ Using exact episodeId from API:', episode.episodeId);
      return episode.episodeId;
    }
    
    // Priority 2: Check if episode has a direct ID
    if (episode.id && typeof episode.id === 'string') {
      console.log('✅ Using episode.id:', episode.id);
      return episode.id;
    }
    
    // Priority 3: Get episode number
    const episodeNumber = getEpisodeNumber(episode, index);
    console.log('🔢 Episode number:', episodeNumber);
    
    // Create SIMPLE episode ID format (like main site)
    // Remove any numbers at the end of animeId
    const cleanAnimeId = animeId.replace(/-\d+$/, '');
    const episodeId = `${cleanAnimeId}?ep=${episodeNumber}`;
    
    console.log('🔧 Generated episode ID:', episodeId);
    return episodeId;
  };

  // Handle empty episodes array
  if (!episodes || episodes.length === 0) {
    return (
      <div className="bg-secondary rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Episodes</h3>
        <div className="text-center py-8">
          <p className="text-gray-400">No episodes available</p>
          <p className="text-gray-500 text-sm mt-2">This anime might not have episodes released yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Episodes</h3>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-900/20 rounded text-xs">
          <div>Total Episodes: {episodes.length}</div>
          <div>Sample Episode ID: {getEpisodeId(episodes[0], 0)}</div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {episodes.map((episode, index) => {
          const episodeNumber = getEpisodeNumber(episode, index);
          const episodeId = getEpisodeId(episode, index);
          const episodeTitle = getEpisodeTitle(episode, episodeNumber);
          
          console.log(`📹 Episode ${episodeNumber}: ${episodeId}`);
          
          return (
            <Link
              key={episodeId}
              href={`/watch/${encodeURIComponent(episodeId)}`}
              className="bg-primary hover:bg-accent text-white p-3 rounded text-center transition-colors group"
            >
              <div className="font-semibold">Ep {episodeNumber}</div>
              <div className="text-xs text-gray-400 group-hover:text-gray-200 truncate mt-1">
                {episodeTitle}
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-[10px] text-gray-500 mt-1 truncate">
                  ID: {episodeId.split('?')[0]}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}