// app/category/[name]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../components/Header';
import AnimeCard from '../../../components/AnimeCard';
import { api } from '../../../utils/api';

export default function CategoryPage() {
  const params = useParams();
  const category = params.name;
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCategory(category);
        setAnimes(data.animes || []);
      } catch (err) {
        setError('Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchCategory();
    }
  }, [category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 capitalize">
          {category?.replace('-', ' ')}
        </h1>
        
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {animes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {animes.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No anime found in this category</p>
          </div>
        )}
      </main>
    </div>
  );
}