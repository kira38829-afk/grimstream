// components/AnimeCard.js
import Link from 'next/link';
import { Play, Star } from 'lucide-react';

export default function AnimeCard({ anime }) {
  // Handle the API data structure
  const getAnimeInfo = () => {
    return {
      id: anime.id,
      name: anime.name,
      poster: anime.poster,
      rating: anime.rank, // Using rank as rating
      episodes: anime.episodes,
      type: anime.type,
      duration: anime.duration,
      description: anime.description,
      jname: anime.jname
    };
  };

  const animeInfo = getAnimeInfo();

  return (
    <Link href={`/anime/${animeInfo.id}`}>
      <div className="anime-card group cursor-pointer">
        <div className="relative overflow-hidden">
          <img
            src={animeInfo.poster}
            alt={animeInfo.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x400/333/fff?text=No+Image';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
            <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {animeInfo.episodes && (
            <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 rounded text-sm">
              EP {animeInfo.episodes.sub || animeInfo.episodes.dub || '?'}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-white truncate group-hover:text-accent transition-colors">
            {animeInfo.name}
          </h3>
          {animeInfo.rating && (
            <div className="flex items-center mt-2 text-yellow-400 text-sm">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1">Rank #{animeInfo.rating}</span>
            </div>
          )}
          {animeInfo.type && (
            <p className="text-gray-400 text-sm mt-1">{animeInfo.type}</p>
          )}
          {animeInfo.episodes && (
            <p className="text-gray-400 text-sm">
              {animeInfo.episodes.sub && `Sub: ${animeInfo.episodes.sub}`}
              {animeInfo.episodes.dub && ` | Dub: ${animeInfo.episodes.dub}`}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}